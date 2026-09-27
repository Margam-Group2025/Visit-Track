import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { forgotPassword } from '../api/authApi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <h1 className="font-heading text-xl text-center text-[var(--text-h)] mb-1">Forgot Password</h1>
        <p className="text-sm text-[var(--text-muted)] text-center mb-6">
          Enter your email and we'll send you a reset link
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 sm:p-8 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
        >
          {message && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              {message}
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl font-medium text-white text-sm transition disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin inline" /> : 'Send Reset Link'}
          </motion.button>

          <Link to="/login" className="flex items-center justify-center gap-1 text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back to login
          </Link>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;