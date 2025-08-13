import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { signup } from '../lib/auth'
import Link from 'next/link';
import { useRouter } from 'next/router';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await signup(email, password, name, surname, username);
      if (response) {
        setMessage('Account created successfully!');
        router.push('/login');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Create Account
        </Typography>
        <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Surname"
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Button fullWidth variant="contained" name="Register" type="submit" sx={{ mt: 2 }}>
            Register
          </Button>
          {message && (
            <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
              {message}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account? <Link href="/login">Login</Link>
            </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;
