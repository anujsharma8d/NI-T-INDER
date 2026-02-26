import { useState } from 'react'
import './Auth.css'
import { BACKEND_URL } from './config'

function Register({ onToggle, onRegisterSuccess }) {
  const [step, setStep] = useState(1) // 1: Enter details, 2: Verify OTP
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    otp: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Start countdown timer for resend
  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || data.message || 'Failed to send OTP. Please try again.')
        return
      }

      setOtpSent(true)
      setStep(2)
      startResendTimer()
    } catch (err) {
      setError('Connection error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return
    
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || data.message || 'Failed to resend OTP.')
        return
      }

      startResendTimer()
      setError('')
    } catch (err) {
      setError('Connection error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || data.message || 'Verification failed. Please try again.')
        return
      }

      // Extract token either from header or response body
      let token = null
      const authHeader = response.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
      if (!token && data.token) {
        token = data.token
      }
      if (token) {
        localStorage.setItem('token', token)
        onRegisterSuccess()
      } else {
        setError('No token received from server.')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep(1)
    setOtpSent(false)
    setFormData((prev) => ({ ...prev, otp: '' }))
    setError('')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1 className="app-name">NITinder</h1>
          <p className="auth-subtitle">
            {step === 1 ? 'Create your profile' : 'Verify your email'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-first">First Name</label>
                <input
                  id="reg-first"
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  autoComplete="given-name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-last">Last Name</label>
                <input
                  id="reg-last"
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                placeholder="name.branch.year@nitj.ac.in"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                autoComplete="email"
              />
              <small className="input-hint">Use your NITJ student email (e.g., john.cse.22@nitj.ac.in)</small>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-wrapper">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={loading} className="auth-button">
              <span className="button-content">
                {loading && <span className="button-spinner" />}
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <div className="otp-info">
              <p>We've sent a 6-digit verification code to:</p>
              <p className="email-display">{formData.email}</p>
            </div>

            <div className="form-group">
              <label htmlFor="reg-otp">Verification Code</label>
              <input
                id="reg-otp"
                type="text"
                name="otp"
                placeholder="000000"
                value={formData.otp}
                onChange={handleChange}
                required
                maxLength="6"
                pattern="[0-9]{6}"
                className="form-input otp-input"
                autoComplete="one-time-code"
                autoFocus
              />
              <small className="input-hint">Enter the 6-digit code sent to your email</small>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={loading} className="auth-button">
              <span className="button-content">
                {loading && <span className="button-spinner" />}
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </span>
            </button>

            <div className="otp-actions">
              <button type="button" onClick={handleBack} className="text-button">
                ← Change Email
              </button>
              <button 
                type="button" 
                onClick={handleResendOTP} 
                disabled={resendTimer > 0}
                className="text-button"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button onClick={onToggle} className="toggle-button">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
