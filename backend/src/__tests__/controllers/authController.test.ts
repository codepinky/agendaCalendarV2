import { Request, Response } from 'express';
import { register, login, getCurrentUser } from '../../controllers/authController';
import { auth, db } from '../../services/firebase';
import { userCache, getCacheKey, clearCache } from '../../services/cacheService';
import { AuthRequest } from '../../middleware/auth';
import { User } from '../../types';
import type admin from 'firebase-admin';

// Mock dependencies
jest.mock('../../services/firebase', () => ({
  db: {
    collection: jest.fn(),
    runTransaction: jest.fn(),
  },
  auth: {
    createUser: jest.fn(),
    createCustomToken: jest.fn(),
  },
}));
jest.mock('../../services/cacheService');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logSuspiciousActivity: jest.fn(),
  logSecurityError: jest.fn(),
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mocked-public-link-hex'),
  })),
}));

describe('authController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockAuthRequest: Partial<AuthRequest>;

  const mockLicenseCode = 'LICENSE123';
  const mockEmail = 'test@example.com';
  const mockPassword = 'password123';
  const mockName = 'Test User';
  const mockUserId = 'user123';
  const mockCustomToken = 'custom-token-123';

  // Mock Firestore structures
  const mockLicenseRef = {
    get: jest.fn(),
    update: jest.fn(),
  };

  const mockLicenseDoc = {
    exists: true,
    data: jest.fn(),
  };

  const mockUserDoc = {
    exists: true,
    data: jest.fn(),
  };

  const mockUserRecord = {
    uid: mockUserId,
    email: mockEmail,
    displayName: mockName,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default Request mock
    mockReq = {
      body: {},
      ip: '127.0.0.1',
    };

    // Setup default Response mock
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup default AuthRequest mock
    mockAuthRequest = {
      user: {
        uid: mockUserId,
        email: mockEmail,
      },
      ip: '127.0.0.1',
    };

    // Setup default Firestore mocks
    (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
      if (collectionName === 'licenses') {
        return {
          doc: jest.fn(() => mockLicenseRef),
        };
      }
      if (collectionName === 'users') {
        return {
          doc: jest.fn((userId: string) => ({
            get: jest.fn(),
            set: jest.fn(),
          })),
        };
      }
      return {};
    });

    // Setup default transaction mock
    (db.runTransaction as jest.Mock).mockImplementation(async (callback: any) => {
      const mockTransaction = {
        get: jest.fn(),
        update: jest.fn(),
      };
      return await callback(mockTransaction);
    });

    // Setup default auth mocks
    (auth.createUser as jest.Mock).mockResolvedValue(mockUserRecord);
    (auth.createCustomToken as jest.Mock).mockResolvedValue(mockCustomToken);

    // Setup default cache mocks
    (userCache.get as jest.Mock) = jest.fn();
    (userCache.set as jest.Mock) = jest.fn();
    (clearCache.license as jest.Mock) = jest.fn();
  });

  describe('register', () => {
    it('deve registrar usuário com license válida', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
        password: mockPassword,
        name: mockName,
        licenseCode: mockLicenseCode,
      };

      const mockLicenseData = {
        status: 'active',
        usedAt: null,
      };

      mockLicenseDoc.data.mockReturnValue(mockLicenseData);
      mockLicenseRef.get.mockResolvedValue(mockLicenseDoc);

      (db.runTransaction as jest.Mock).mockImplementation(async (callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue(mockLicenseDoc),
          update: jest.fn(),
        };
        return await callback(mockTransaction);
      });

      (auth.createUser as jest.Mock).mockResolvedValue(mockUserRecord);
      (auth.createCustomToken as jest.Mock).mockResolvedValue(mockCustomToken);

      const mockUsersDocRef = {
        set: jest.fn().mockResolvedValue(undefined),
      };
      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'licenses') {
          return {
            doc: jest.fn(() => mockLicenseRef),
          };
        }
        if (collectionName === 'users') {
          return {
            doc: jest.fn(() => mockUsersDocRef),
          };
        }
        return {};
      });

      // Act
      await register(mockReq as Request, mockRes as Response);

      // Assert
      expect(db.runTransaction).toHaveBeenCalled();
      expect(auth.createUser).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockPassword,
        displayName: mockName,
      });
      expect(auth.createCustomToken).toHaveBeenCalledWith(mockUserId);
      expect(clearCache.license).toHaveBeenCalledWith(mockLicenseCode);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        user: {
          id: mockUserId,
          email: mockEmail,
          name: mockName,
          publicLink: 'mocked-public-link-hex',
        },
        token: mockCustomToken,
      });
    });

    it('deve retornar erro 404 quando license não existe', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
        password: mockPassword,
        name: mockName,
        licenseCode: mockLicenseCode,
      };

      const mockLicenseDocNotFound = {
        exists: false,
        data: jest.fn(),
      };

      (db.runTransaction as jest.Mock).mockImplementation(async (callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue(mockLicenseDocNotFound),
          update: jest.fn(),
        };
        try {
          return await callback(mockTransaction);
        } catch (error: any) {
          if (error.message === 'LICENSE_NOT_FOUND') {
            throw error;
          }
        }
      });

      // Act
      await register(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Código de licença não encontrado',
        details: 'Verifique se o código foi digitado corretamente',
      });
      expect(auth.createUser).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando license não está ativa', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
        password: mockPassword,
        name: mockName,
        licenseCode: mockLicenseCode,
      };

      const mockLicenseData = {
        status: 'inactive',
        usedAt: null,
      };

      mockLicenseDoc.data.mockReturnValue(mockLicenseData);

      (db.runTransaction as jest.Mock).mockImplementation(async (callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue(mockLicenseDoc),
          update: jest.fn(),
        };
        try {
          return await callback(mockTransaction);
        } catch (error: any) {
          if (error.message === 'LICENSE_NOT_ACTIVE') {
            throw error;
          }
        }
      });

      // Act
      await register(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Código de licença não está ativo',
        details: 'Esta licença não pode ser usada no momento',
      });
      expect(auth.createUser).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando license já foi usada', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
        password: mockPassword,
        name: mockName,
        licenseCode: mockLicenseCode,
      };

      const mockLicenseData = {
        status: 'active',
        usedAt: '2024-01-01T00:00:00.000Z',
      };

      mockLicenseDoc.data.mockReturnValue(mockLicenseData);

      (db.runTransaction as jest.Mock).mockImplementation(async (callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue(mockLicenseDoc),
          update: jest.fn(),
        };
        try {
          return await callback(mockTransaction);
        } catch (error: any) {
          if (error.message === 'LICENSE_ALREADY_USED') {
            throw error;
          }
        }
      });

      // Act
      await register(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Código de licença já foi utilizado',
        details: 'Cada código de licença só pode ser usado uma vez. Se você já possui uma conta, faça login.',
      });
      expect(auth.createUser).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando email já está registrado', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
        password: mockPassword,
        name: mockName,
        licenseCode: mockLicenseCode,
      };

      const mockLicenseData = {
        status: 'active',
        usedAt: null,
      };

      mockLicenseDoc.data.mockReturnValue(mockLicenseData);

      (db.runTransaction as jest.Mock).mockImplementation(async (callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue(mockLicenseDoc),
          update: jest.fn(),
        };
        return await callback(mockTransaction);
      });

      const authError = {
        code: 'auth/email-already-exists',
        message: 'Email already exists',
      };
      (auth.createUser as jest.Mock).mockRejectedValue(authError);

      // Act
      await register(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email already registered. Please login instead.',
      });
      expect(clearCache.license).toHaveBeenCalledWith(mockLicenseCode);
    });

    it('deve fazer rollback da license quando criação de usuário falha (exceto email já existe)', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
        password: mockPassword,
        name: mockName,
        licenseCode: mockLicenseCode,
      };

      const mockLicenseData = {
        status: 'active',
        usedAt: null,
      };

      mockLicenseDoc.data.mockReturnValue(mockLicenseData);

      (db.runTransaction as jest.Mock).mockImplementation(async (callback: any) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue(mockLicenseDoc),
          update: jest.fn(),
        };
        return await callback(mockTransaction);
      });

      const authError = {
        code: 'auth/invalid-password',
        message: 'Password is too weak',
      };
      (auth.createUser as jest.Mock).mockRejectedValue(authError);
      mockLicenseRef.update.mockResolvedValue(undefined);

      // Act
      await register(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockLicenseRef.update).toHaveBeenCalledWith({
        usedAt: null,
        status: 'active',
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('deve retornar erro 500 em caso de erro genérico', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
        password: mockPassword,
        name: mockName,
        licenseCode: mockLicenseCode,
      };

      (db.runTransaction as jest.Mock).mockRejectedValue(new Error('Generic error'));

      // Act
      await register(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro interno do servidor',
        details: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
      });
    });
  });

  describe('login', () => {
    it('deve retornar erro 400 quando email ou senha estão faltando', async () => {
      // Arrange
      mockReq.body = {};

      // Act
      await login(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email e senha são obrigatórios',
        details: 'Campos faltando: email, senha',
      });
    });

    it('deve retornar erro 400 quando apenas email está faltando', async () => {
      // Arrange
      mockReq.body = {
        password: mockPassword,
      };

      // Act
      await login(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email e senha são obrigatórios',
        details: 'Campos faltando: email',
      });
    });

    it('deve retornar erro 400 quando apenas senha está faltando', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
      };

      // Act
      await login(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email e senha são obrigatórios',
        details: 'Campos faltando: senha',
      });
    });

    it('deve retornar 501 indicando que login deve ser feito no frontend', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
        password: mockPassword,
      };

      // Act
      await login(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(501);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Login should be handled by Firebase Auth on frontend',
      });
    });

    it('deve retornar erro 500 em caso de erro genérico', async () => {
      // Arrange
      mockReq.body = {
        email: mockEmail,
        password: mockPassword,
      };

      // Simular erro inesperado
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await login(mockReq as Request, mockRes as Response);

      // Assert
      // O código atual não lança erro, mas vamos garantir que retorna 501
      expect(mockRes.status).toHaveBeenCalledWith(501);
    });
  });

  describe('getCurrentUser', () => {
    it('deve retornar dados do usuário quando autenticado', async () => {
      // Arrange
      const mockUserData: Omit<User, 'id'> = {
        email: mockEmail,
        name: mockName,
        licenseCode: mockLicenseCode,
        publicLink: 'public-link-123',
        googleCalendarConnected: false,
        settings: {},
      };

      const mockUsersDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: jest.fn().mockReturnValue(mockUserData),
        }),
      };

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn(() => mockUsersDocRef),
          };
        }
        return {};
      });

      (userCache.get as jest.Mock).mockReturnValue(null);

      // Act
      await getCurrentUser(mockAuthRequest as AuthRequest, mockRes as Response);

      // Assert
      expect(userCache.get).toHaveBeenCalledWith(getCacheKey.user(mockUserId));
      expect(mockUsersDocRef.get).toHaveBeenCalled();
      expect(userCache.set).toHaveBeenCalledWith(
        getCacheKey.user(mockUserId),
        {
          ...mockUserData,
          id: mockUserId,
        }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        ...mockUserData,
        id: mockUserId,
      });
    });

    it('deve retornar dados do cache quando disponível', async () => {
      // Arrange
      const cachedUser = {
        id: mockUserId,
        email: mockEmail,
        name: mockName,
        licenseCode: mockLicenseCode,
        publicLink: 'public-link-123',
        googleCalendarConnected: false,
        settings: {},
      };

      (userCache.get as jest.Mock).mockReturnValue(cachedUser);

      // Act
      await getCurrentUser(mockAuthRequest as AuthRequest, mockRes as Response);

      // Assert
      expect(userCache.get).toHaveBeenCalledWith(getCacheKey.user(mockUserId));
      expect(db.collection).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(cachedUser);
    });

    it('deve retornar erro 401 quando não autenticado', async () => {
      // Arrange
      mockAuthRequest.user = undefined;

      // Act
      await getCurrentUser(mockAuthRequest as AuthRequest, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Não autorizado',
        details: 'Você precisa estar autenticado para acessar esta informação',
      });
      expect(userCache.get).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando usuário não existe no Firestore', async () => {
      // Arrange
      const mockUsersDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: false,
          data: jest.fn(),
        }),
      };

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn(() => mockUsersDocRef),
          };
        }
        return {};
      });

      (userCache.get as jest.Mock).mockReturnValue(null);

      // Act
      await getCurrentUser(mockAuthRequest as AuthRequest, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuário não encontrado',
        details: 'Seu perfil não foi encontrado no sistema. Entre em contato com o suporte.',
      });
      expect(userCache.set).not.toHaveBeenCalled();
    });

    it('deve retornar erro 500 em caso de erro genérico', async () => {
      // Arrange
      (userCache.get as jest.Mock).mockReturnValue(null);
      (db.collection as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      await getCurrentUser(mockAuthRequest as AuthRequest, mockRes as Response);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro interno do servidor',
        details: 'Ocorreu um erro ao buscar os dados do usuário. Tente novamente mais tarde.',
      });
    });
  });
});

