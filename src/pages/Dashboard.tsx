import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SidebarLayout from "../layouts/SidebarLayout";
import { useState, useEffect } from "react";
import { getBuildings } from "../buildings";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const location = useLocation();
  const fromLogin = location.state?.fromLogin;
  const [buildings, setBuildings] = useState<any[]>([]);

  const [showFade, setShowFade] = useState(fromLogin);

  // Remove overlay after fade duration
  useEffect(() => {
    if (fromLogin) {
      const timer = setTimeout(() => setShowFade(false), 600); // match fade duration
      return () => clearTimeout(timer);
    }
  }, [fromLogin]);

  useEffect(() => {
    async function load() {
      const data = await getBuildings();
      setBuildings(data);
    }
    load();
  }, []);


  return (
    <>
      {/* Fade overlay */}
      <AnimatePresence>
        {showFade && (
          <motion.div
            className="fixed inset-0 bg-black z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Dashboard content */}
      <SidebarLayout background="white">
        <div className="bg-white h-screen p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to the Dashboard, Cael!</h1>
          <p>What would you like to do?</p>
          <Link to="/add-building">Add Building</Link>
          
          <h1>Buildings</h1>

          {buildings.length === 0 ? (
            <p>No buildings yet</p>
          ) : (
            <ul>
              {buildings.map((b) => (
                <li key={b.id}>
                  {b.building_name} — {b.college_name}
                  {" | "}
                  <Link to={`/edit-building/${b.id}`}>Edit</Link>
                </li>
              ))}
            </ul>
          )}
        </div>      
      </SidebarLayout>
    </>
  );
}
