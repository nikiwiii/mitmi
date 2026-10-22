import React, { useState } from 'react';
import { Calendar, LogIn, UserPlus, Lock, User as UserIcon2 } from 'lucide-react';
import { loginAccount, registerAccount } from '../api.js';
import { User } from '../types.js';
import { IconPicker } from './UserIcon.js';

interface AuthScreenProps {
  onAuthenticated: (token: string, user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [avatar, setAvatar] = useState('Crown');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isRegister && password !== confirm) {
      setError('hasla nie sa takie same');
      return;
    }
    setLoading(true);
    try {
      const result = isRegister
        ? await registerAccount(username.trim(), password, avatar)
        : await loginAccount(username.trim(), password);
      onAuthenticated(result.token, result.user);
    } catch (err: any) {
      setError(err?.message || 'cos poszlo nie tak');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="dashboard-container auth-frame">
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Calendar size={20} />
          </div>
          <div className="brand-title">mit<span>.mi</span></div>
        </div>

        <div className="welcome-hero">
          <h1>{isRegister ? 'Create account' : 'Welcome back'}</h1>
          <p>
            {isRegister
              ? 'Załóż konto, aby tworzyć spotkania i zapisywać swoją dostępność.'
              : 'Zaloguj się, aby zobaczyć swoje spotkania i uzupełnić dostępność.'}
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-username">Nazwa użytkownika</label>
            <div className="input-with-icon">
              <UserIcon2 size={15} />
              <input
                id="auth-username"
                type="text"
                className="form-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="np. aisha"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Hasło</label>
            <div className="input-with-icon">
              <Lock size={15} />
              <input
                id="auth-password"
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="min. 8 znaków"
                minLength={isRegister ? 8 : undefined}
                required
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-confirm">Powtórz hasło</label>
                <div className="input-with-icon">
                  <Lock size={15} />
                  <input
                    id="auth-confirm"
                    type="password"
                    className="form-input"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Wybierz ikonę profilu</label>
                <IconPicker value={avatar} onChange={setAvatar} />
              </div>
            </>
          )}

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="action-btn-primary auth-submit" disabled={loading}>
            {isRegister ? <UserPlus size={15} /> : <LogIn size={15} />}
            <span>{loading ? 'Chwileczkę...' : isRegister ? 'Załóż konto' : 'Zaloguj się'}</span>
          </button>

          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register');
              setError(null);
            }}
          >
            {isRegister ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
          </button>
        </form>
      </div>
    </div>
  );
};
