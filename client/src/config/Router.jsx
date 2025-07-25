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
import NoticeBoard from '../pages/NoticeBoard';
import NoticeDetails from '../pages/NoticeDetails';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="history" element={<History />} />
        <Route path="submit" element={<SubmitComplaint />} />
        <Route path="notice-board" element={<NoticeBoard />} />
        <Route path="/notice-details" element={<NoticeDetails />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default router;
