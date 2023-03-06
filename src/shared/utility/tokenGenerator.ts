import config from 'config';
import jwt from 'jsonwebtoken';
export const generateAuthToken = (id: string) => {
  return jwt.sign({ id }, config.get('jwtSecret'), {
    expiresIn: '14d',
  });
};

export const decodeAuthToken = (token) => {
  return jwt.verify(token, config.get('jwtSecret'));
};
