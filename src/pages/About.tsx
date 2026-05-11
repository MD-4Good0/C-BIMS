import SidebarLayout from "../layouts/SidebarLayout"
import AboutBG from '../assets/AboutBG.jpg'

import { motion } from "framer-motion"

export default function About() {
  return (
    <SidebarLayout background={AboutBG}>
      <div
        className="relative font-poppins flex justify-center items-center h-screen bg-black bg-cover bg-center"
        style={{ backgroundImage: `url(${AboutBG})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col gap-10 items-center m-5">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center text-3xl font-light text-white mb-3">University of the Philippines Manila's</div>
            <div className="text-center text-4xl font-extrabold text-white/80">Building Inventory Management System</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center backdrop-blur-sm bg-upyellow/60 rounded-lg px-15 py-10 w-full
            sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto gap-5 text-white/60 hover:scale-105 transition hover:text-white"
          >
            <h1 className="font-bold text-3xl">ABOUT</h1>
            <p className="text-center text-base">
              The UP Manila Buildings Inventory Management System—UPM BIMS—is an architectural inventory that records
              the different attributes of university buildings. It also visualizes the organization of rooms on the floors
              within each college's buildings.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center backdrop-blur-sm bg-upgreen/60 rounded-lg px-15 py-10 w-full
            sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto gap-5 text-white/60 hover:scale-105 transition hover:text-white"
          >
            <h1 className="font-bold text-3xl">MISSION</h1>
            <p className="text-center text-base">
            To maintain an updated record of the physical, regulatory, and compliance information of the buildings of the University of the Philippines Manila.
            This system also aims to provide on-the-go reports for the different statuses of UP Manila buildings.
            </p>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  )
}
