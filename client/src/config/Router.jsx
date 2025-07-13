import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import App from '../App';
import Layout from '../components/ui/commonComponents/Layout';
import HomePage from '../pages/HomePage';
import History from '../pages/History';
import NotFound from '../pages/NotFound';
import SubmitComplaint from '../pages/SubmitComplaint';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} /> {/* 👈 index for "/" */}
        <Route path="history" element={<History />} />
        <Route path="submit" element={<SubmitComplaint />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default router;
