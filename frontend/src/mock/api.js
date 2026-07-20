// Cliente do backend real
import axios from 'axios';
import { ALGORITHMS } from './algorithms';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export async function analyzeSymptoms({ description, age = '', sex = '' }) {
  if (!description || !description.trim()) return null;
  const { data } = await axios.post(`${API}/analyze`, { description, age, sex });
  const primaryFull = ALGORITHMS.find((a) => a.id === data.primary?.id);
  return { ...data, primary: primaryFull || data.primary };
}

export async function saveTriagem(entry) {
  const { data } = await axios.post(`${API}/history`, entry);
  return data;
}

export async function getHistorico() {
  const { data } = await axios.get(`${API}/history`);
  return data;
}

export async function deleteTriagem(id) {
  await axios.delete(`${API}/history/${id}`);
}

export { TRIAGE_LEVELS } from './algorithms';
