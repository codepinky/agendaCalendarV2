import { useState } from 'react';
import { Container, Form, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { labels } from '../../locales/pt-BR';
import Button from '../../components/shared/Button/Button';
import Input from '../../components/shared/Input/Input';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = labels.errorRequired;
    if (!formData.password) newErrors.password = labels.errorRequired;

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

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Get ID token
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', token);
      
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError(labels.errorInvalidCredentials);
      } else {
        setError(err.message || labels.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="login-container">
      <div className="login-card">
        <h1 className="login-title">{labels.loginTitle}</h1>
        
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
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

          <Button type="submit" disabled={loading}>
            {loading ? labels.loading : labels.loginButton}
          </Button>
        </Form>

        <p className="login-footer">
          {labels.dontHaveAccount} <Link to="/register">{labels.registerLink}</Link>
        </p>
      </div>
    </Container>
  );
}

export default Login;
