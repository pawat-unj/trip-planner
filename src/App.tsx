import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home, Editor, Viewer } from './pages';
import './index.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/edit" element={<Editor />} />
        <Route path="/view" element={<Viewer />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
