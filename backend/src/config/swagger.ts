import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Agenda Calendar API',
    version: '1.0.0',
    description: 'API para sistema de agendamento de horários com integração Google Calendar e Kiwify',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:3000',
      description: 'Servidor de desenvolvimento',
    },
    {
      url: 'https://agendacalendar.duckdns.org',
      description: 'Servidor de produção',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token de autenticação Firebase. Obtenha através do endpoint /api/auth/register ou /api/auth/login',
      },
      webhookSecret: {
        type: 'apiKey',
        in: 'header',
        name: 'x-webhook-secret',
        description: 'Secret para autenticação de webhooks (configurado em WEBHOOK_BRIDGE_SECRET)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Mensagem de erro',
            example: 'Erro interno do servidor',
          },
          details: {
            type: 'string',
            description: 'Detalhes adicionais do erro',
            example: 'Ocorreu um erro ao processar a requisição.',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID do usuário (Firebase UID)',
            example: 'abc123def456',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@exemplo.com',
          },
          name: {
            type: 'string',
            example: 'João Silva',
          },
          publicLink: {
            type: 'string',
            description: 'Link público para agendamentos',
            example: 'a1b2c3d4e5f6g7h8',
          },
          googleCalendarConnected: {
            type: 'boolean',
            example: false,
          },
        },
      },
      AvailableSlot: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'slot123',
          },
          date: {
            type: 'string',
            format: 'date',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            example: '2025-12-20',
            description: 'Data no formato YYYY-MM-DD',
          },
          startTime: {
            type: 'string',
            pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
            example: '14:30',
            description: 'Hora de início no formato HH:mm',
          },
          endTime: {
            type: 'string',
            pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
            example: '15:30',
            description: 'Hora de fim no formato HH:mm',
          },
          status: {
            type: 'string',
            enum: ['available', 'reserved', 'confirmed', 'cancelled'],
            example: 'available',
          },
          maxBookings: {
            type: 'number',
            example: 1,
            description: 'Número máximo de agendamentos (sempre 1)',
          },
          bufferMinutes: {
            type: 'number',
            example: 30,
            description: 'Intervalo mínimo em minutos antes do próximo slot',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-12-18T10:00:00Z',
          },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'booking123',
          },
          slotId: {
            type: 'string',
            example: 'slot123',
          },
          date: {
            type: 'string',
            format: 'date',
            example: '2025-12-20',
          },
          startTime: {
            type: 'string',
            example: '14:30',
          },
          endTime: {
            type: 'string',
            example: '15:30',
          },
          clientName: {
            type: 'string',
            example: 'Maria Santos',
          },
          clientEmail: {
            type: 'string',
            format: 'email',
            example: 'maria@exemplo.com',
          },
          clientPhone: {
            type: 'string',
            example: '(11) 98765-4321',
          },
          notes: {
            type: 'string',
            example: 'Cliente prefere horário da manhã',
          },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'cancelled'],
            example: 'confirmed',
          },
          orderNumber: {
            type: 'number',
            example: 1703001234567,
          },
          reservedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-12-18T10:00:00Z',
          },
          confirmedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-12-18T10:00:00Z',
          },
        },
      },
      License: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            example: 'LIC-A1B2C3D4E5F6',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'comprador@exemplo.com',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
            example: 'active',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-12-18T10:00:00Z',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Auth',
      description: 'Endpoints de autenticação e registro',
    },
    {
      name: 'Slots',
      description: 'Gerenciamento de horários disponíveis',
    },
    {
      name: 'Bookings',
      description: 'Agendamentos públicos e gerenciamento',
    },
    {
      name: 'Licenses',
      description: 'Validação de códigos de licença',
    },
    {
      name: 'Google Calendar',
      description: 'Integração com Google Calendar',
    },
    {
      name: 'Webhooks',
      description: 'Webhooks externos (Kiwify)',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

