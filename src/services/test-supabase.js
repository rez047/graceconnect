import { getDepartments, getVerses } from './services/db';

getVerses('grief').then(({ data, error }) => {
  console.log('✅ Connected! Verses:', data, error);
});