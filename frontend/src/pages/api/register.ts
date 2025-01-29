import axios from 'axios';

export default async (req: any, res: any) => {
  try {
    const response = await axios.post('http://localhost:5000/register', req.body);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};
