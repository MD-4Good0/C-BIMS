import SidebarLayout from "../layouts/SidebarLayout";
import AboutBG from "../assets/AboutBG.jpg";
import { motion } from "framer-motion";

export default function About() {
  return (
    <SidebarLayout background={AboutBG}>
      <div className="relative min-h-screen overflow-y-auto bg-black font-poppins">
        <div
          className="fixed inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${AboutBG})` }}
        />

        <div className="fixed inset-0 bg-black/60" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <p className="text-lg font-light leading-tight text-white/80 sm:text-xl md:text-2xl">
              University of the Philippines Manila&apos;s
            </p>

            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
              Building Inventory Management System
            </h1>
          </motion.div>

          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="rounded-2xl border border-white/20 bg-upyellow/55 px-8 py-8 text-center text-white shadow-xl backdrop-blur-md transition-transform duration-300 hover:scale-[1.03]"
            >
              <h2 className="mb-5 text-3xl font-extrabold tracking-wide">
                ABOUT
              </h2>

              <p className="mx-auto max-w-xl text-base leading-8 text-white/90">
                The UP Manila Buildings Inventory Management System, or UPM BIMS,
                is an architectural inventory that records the different
                attributes of university buildings. It also visualizes the
                organization of rooms on the floors within each college&apos;s
                buildings.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rounded-2xl border border-white/20 bg-upgreen/85 px-8 py-8 text-center text-white shadow-xl backdrop-blur-md transition-transform duration-300 hover:scale-[1.03]"
            >
              <h2 className="mb-5 text-3xl font-extrabold tracking-wide">
                MISSION
              </h2>

              <p className="mx-auto max-w-xl text-base leading-8 text-white/90">
                To maintain an updated record of the physical, regulatory, and
                compliance information of the buildings of the University of the
                Philippines Manila. This system also aims to provide on-the-go
                reports for the different statuses of UP Manila buildings.
              </p>
            </motion.section>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}