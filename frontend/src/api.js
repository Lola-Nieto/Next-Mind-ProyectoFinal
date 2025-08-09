import axios from 'axios';

export const sendMessage = async (mensaje) => {
  const response = await axios.post('http://localhost:3001/api/chat', { mensaje });
  return response.data.data?.result || response.data.respuesta || '';
}; 