import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SkillPage from './pages/SkillPage';
import SharePage from './pages/SharePage';
import Docs from './pages/Docs';
import PackPage from './pages/PackPage';

function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/s/:token" element={<SkillPage />} />
        <Route path="/share/:token" element={<SharePage />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/p/:token" element={<PackPage />} />
      </Routes>
    </div>
  );
}

export default App;
