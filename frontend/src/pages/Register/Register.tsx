import { useState } from 'react';
import { Container, Form, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { labels } from '../../locales/pt-BR';
import Button from '../../components/shared/Button/Button';
import Input from '../../components/shared/Input/Input';
import api from '../../services/api';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../services/firebase';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    licenseCode: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateLicense = async () => {
    try {
      const response = await api.post('/licenses/validate', {
        code: formData.licenseCode,
      });
      return response.data.valid;
    } catch (err: any) {
      setError(err.response?.data?.error || labels.errorGeneric);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.licenseCode) newErrors.licenseCode = labels.errorRequired;
    if (!formData.name) newErrors.name = labels.errorRequired;
    if (!formData.email) newErrors.email = labels.errorRequired;
    if (!formData.password) newErrors.password = labels.errorRequired;
    if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = labels.errorPasswordMismatch;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ email: labels.errorInvalidEmail });
      return;
    }

    // Validate license first
    const isValid = await validateLicense();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        licenseCode: formData.licenseCode,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Sign in with custom token
      await signInWithCustomToken(auth, response.data.token);
      
      // Store token
      localStorage.setItem('authToken', response.data.token);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || labels.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="register-container">
      <div className="register-card">
        <h1 className="register-title">{labels.registerTitle}</h1>
        
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Input
            label={labels.licenseCode}
            placeholder={labels.licenseCodePlaceholder}
            value={formData.licenseCode}
            onChange={(e) => setFormData({ ...formData, licenseCode: e.target.value })}
            error={errors.licenseCode}
            required
          />

          <Input
            label={labels.name}
            placeholder={labels.namePlaceholder}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />

          <Input
            type="email"
            label={labels.email}
            placeholder={labels.emailPlaceholder}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />

          <Input
            type="password"
            label={labels.password}
            placeholder={labels.passwordPlaceholder}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            required
          />

          <Input
            type="password"
            label={labels.confirmPassword}
            placeholder={labels.confirmPasswordPlaceholder}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? labels.loading : labels.registerButton}
          </Button>
        </Form>

        <p className="register-footer">
          {labels.alreadyHaveAccount} <Link to="/login">{labels.loginLink}</Link>
        </p>
      </div>
    </Container>
  );
}

export default Register;
