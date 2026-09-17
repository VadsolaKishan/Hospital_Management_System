import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, Activity, ShieldCheck, Clock, Users, 
  Calendar, ChevronDown, Stethoscope, FileText, HeartPulse,
  Phone, Mail, MapPin
} from 'lucide-react';

export default function Index() {
  const [ekgPath, setEkgPath] = useState('');
  const { scrollYProgress } = useScroll();
  const yPos = useTransform(scrollYProgress, [0, 1], [0, -150]);

  // Generate a dynamic EKG path (Green for light mode)
  useEffect(() => {
    const patternWidth = 1000;
    const height = 200;
    const baseline = height / 2;

    const segments = [];
    let x = 0;

    while (x < patternWidth) {
      x += Math.random() * 30 + 20;
      if (x >= patternWidth) break;
      segments.push({ type: 'L', x, y: baseline });

      const spikeHeight = Math.random() * 100 + 30;
      segments.push({ type: 'L', x: x + 5, y: baseline - spikeHeight });
      segments.push({ type: 'L', x: x + 10, y: baseline + spikeHeight * 0.6 });
      segments.push({ type: 'L', x: x + 15, y: baseline });
      x += 20;
    }

    let path = `M 0 ${baseline}`;

    // First copy
    for (const seg of segments) {
      path += ` L ${seg.x} ${seg.y}`;
    }
    path += ` L ${patternWidth} ${baseline}`;

    // Second copy
    for (const seg of segments) {
      path += ` L ${seg.x + patternWidth} ${seg.y}`;
    }
    path += ` L ${patternWidth * 2} ${baseline}`;

    setEkgPath(path);
  }, []);

  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  const features = [
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Smart Appointments",
      description: "Effortlessly schedule and manage patient appointments with our intuitive calendar interface."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Patient Management",
      description: "Comprehensive electronic health records, patient history, and detailed medical profiles in one secure place."
    },
    {
      icon: <Stethoscope className="h-6 w-6" />,
      title: "Doctor Portals",
      description: "Dedicated dashboards for medical professionals to track their daily schedules and patient interactions."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Advanced Billing",
      description: "Streamlined invoicing, payment tracking, and financial reporting for seamless hospital operations."
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Secure & Compliant",
      description: "Enterprise-grade encryption and privacy controls ensuring all medical data remains strictly confidential."
    },
    {
      icon: <HeartPulse className="h-6 w-6" />,
      title: "Real-time Monitoring",
      description: "Live dashboards for bed management, laboratory requests, and critical patient status updates."
    }
  ];

  const stats = [
    { value: "10k+", label: "Patients Served" },
    { value: "50+", label: "Specialist Doctors" },
    { value: "24/7", label: "Emergency Care" },
    { value: "99%", label: "Satisfaction Rate" },
  ];

  const departments = [
    {
      name: "Cardiology",
      description: "State-of-the-art heart care with advanced monitoring and expert cardiologists.",
      image: "/departments/cardiology.png"
    },
    {
      name: "Neurology",
      description: "Comprehensive brain and nervous system care utilizing modern MRI technology.",
      image: "/departments/neurology.png"
    },
    {
      name: "Pediatrics",
      description: "Compassionate, specialized care for infants, children, and adolescents.",
      image: "/departments/pediatrics.png"
    },
    {
      name: "Orthopedics",
      description: "Advanced bone, joint, and physical therapy treatments for optimal recovery.",
      image: "/departments/orthopedics.png"
    }
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50/50 dark:bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-background via-primary/5 to-background pointer-events-none"></div>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-primary/10 rounded-[100%] blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-slow" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[800px] h-[800px] bg-secondary/10 rounded-[100%] blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        <div className="absolute top-[25%] sm:top-0 sm:inset-0 sm:left-0 sm:right-0 sm:bottom-0 left-0 right-0 flex items-center justify-center opacity-[0.08] sm:opacity-[0.10] dark:opacity-[0.15] sm:dark:opacity-[0.40]">
          <svg className="w-[150%] sm:w-full h-64 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
            <defs>
              <linearGradient id="ekg-light" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="20%" stopColor="hsl(var(--primary))" />
                <stop offset="80%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d={ekgPath || "M0 100 L2000 100"}
              stroke="url(#ekg-light)"
              strokeWidth="2"
              fill="none"
              className="animate-ekg-scroll"
            />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12 backdrop-blur-md bg-background/60 border-b border-border/40"
      >
        <div className="flex items-center gap-2 w-full justify-center sm:justify-start lg:w-1/3">
          <img src="/logo.png" alt="Velora Care Logo" className="h-10 w-auto object-contain drop-shadow-sm" />
          <span className="text-xl sm:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap">
            Velora Care
          </span>
        </div>
        
        <div className="hidden lg:flex items-center justify-center gap-8 w-1/3 text-sm font-semibold text-foreground/80">
          <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-primary transition-colors">About Us</a>
          <a href="#departments" onClick={(e) => { e.preventDefault(); document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Specialties</a>
          <a href="#capabilities" onClick={(e) => { e.preventDefault(); document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Capabilities</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-primary transition-colors">Contact</a>
        </div>

        <div className="hidden sm:flex items-center justify-end gap-2 sm:gap-4 lg:w-1/3">
          <Link to="/login" className="text-sm font-bold text-foreground hover:text-primary transition-colors px-4 py-2 rounded-full border border-transparent hover:border-border/50 bg-background/50 hover:bg-muted/50 whitespace-nowrap">
            Provider Login
          </Link>
          <Link to="/register" className="inline-flex relative items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/40">
            <span>Patient Portal</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.nav>

      <div className="relative z-10 w-full">
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-32 px-4 sm:px-6">
          <motion.div 
            style={{ y: yPos }}
            className="w-full max-w-5xl mx-auto text-center space-y-6 sm:space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold mb-2 sm:mb-4 max-w-full"
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span className="truncate whitespace-normal leading-tight">Next-Generation Healthcare Management</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]"
            >
              Elevating Medical Care <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Beyond Boundaries
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Velora Care is a comprehensive hospital management system designed to streamline clinical operations, enhance patient experiences, and empower medical professionals.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link 
                to="/login"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-4 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/40 w-full sm:w-auto"
              >
                <span>Enter Staff Portal</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a 
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-card border border-border/60 px-8 py-4 font-bold text-foreground shadow-sm transition-all hover:bg-muted/50 w-full sm:w-auto"
              >
                <span>Discover Velora Care</span>
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-primary transition-colors z-20"
            onClick={scrollToNextSection}
          >
            <span className="text-xs sm:text-sm font-medium uppercase tracking-widest hidden sm:block">Scroll Down</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-border/40 bg-card/30 backdrop-blur-sm relative z-10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center space-y-2"
                >
                  <h3 className="text-4xl font-extrabold text-foreground">{stat.value}</h3>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-24 relative z-10 bg-background/50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full md:w-1/2 space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
                  <Activity className="w-4 h-4" />
                  <span>About Us</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                  Committed to <span className="text-primary">Excellence</span> in Healthcare
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  At Velora Care, we believe that modern healthcare requires a perfect synergy of expert medical professionals and cutting-edge technology. Our comprehensive hospital management ecosystem is designed to eliminate administrative friction, allowing doctors to focus entirely on what matters most: patient care.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  With a legacy of trust and a vision for the future, we provide a secure, efficient, and compassionate environment for both our staff and the communities we serve.
                </p>
                <div className="pt-4">
                  <Link 
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-card border border-border/60 px-6 py-3 font-bold text-foreground shadow-sm transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  >
                    <span>Join as a Patient</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full md:w-1/2"
              >
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-border/50 group">
                  <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-500 z-10 mix-blend-overlay"></div>
                  <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop" alt="Modern Hospital Building" className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Departments Section */}
        <section id="departments" className="py-24 relative z-10 bg-card/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Our Specialized <span className="text-primary">Departments</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Explore our world-class medical departments, equipped with advanced technology and staffed by renowned specialists.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {departments.map((dept, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-background shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col sm:flex-row h-full"
                >
                  <div className="sm:w-2/5 overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                    <img src={dept.image} alt={dept.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 min-h-[200px]" />
                  </div>
                  <div className="sm:w-3/5 p-6 sm:p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-foreground mb-3">{dept.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {dept.description}
                    </p>
                    <div className="mt-6 flex items-center text-primary font-bold text-sm group-hover:translate-x-2 transition-transform cursor-pointer">
                      <span>View Specialists</span>
                      <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="capabilities" className="py-24 relative z-10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Everything you need to run a <span className="text-primary">modern hospital</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Our platform provides a complete suite of tools to handle every aspect of your healthcare facility, from front-desk reception to complex laboratory tracking.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative z-10">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-primary to-secondary p-10 md:p-16 text-center text-primary-foreground shadow-2xl"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              
              <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                  Ready to transform your healthcare facility?
                </h2>
                <p className="text-lg text-primary-foreground/90 font-medium">
                  Join hundreds of medical institutions using Velora Care to deliver exceptional patient experiences and optimize operational efficiency.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link 
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-primary shadow-lg transition-all hover:scale-105 hover:bg-slate-50 w-full sm:w-auto"
                  >
                    <span>Enter Staff Portal</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link 
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-foreground/10 backdrop-blur-md border border-white/20 px-8 py-4 font-bold text-white shadow-lg transition-all hover:bg-white/20 w-full sm:w-auto"
                  >
                    <span>Become a Partner</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section id="contact" className="py-24 relative z-10 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Get in <span className="text-primary">Touch</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Our dedicated support team is available 24/7 to assist you with any inquiries or emergency requests.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Emergency Hotline</h3>
                <p className="text-muted-foreground">1-800-VELORA-CARE</p>
                <p className="text-primary font-bold text-sm mt-2">Available 24/7</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Email Support</h3>
                <p className="text-muted-foreground">contact@veloracare.com</p>
                <p className="text-primary font-bold text-sm mt-2">Reply within 2 hours</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Main Hospital</h3>
                <p className="text-muted-foreground">123 Health Avenue</p>
                <p className="text-primary font-bold text-sm mt-2">Medical District, NY 10001</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border/40 relative z-10 bg-background/80 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Velora Care Logo" className="h-6 w-auto grayscale opacity-70" />
              <span className="text-sm font-bold text-muted-foreground">© {new Date().getFullYear()} Velora Care. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm font-medium text-muted-foreground">
              <Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="#" className="hover:text-primary transition-colors">Support</Link>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes ekg-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ekg-scroll {
          animation: ekg-scroll 20s linear infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
