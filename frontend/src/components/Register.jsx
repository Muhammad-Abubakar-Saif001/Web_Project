import React from 'react';
import { AuthScreen } from './Login';

export function Register(props) {
  return <AuthScreen {...props} initialMode="register" />;
}

export default Register;
