import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  Recycle, 
  Factory, 
  BarChart3, 
  Shield, 
  Globe,
  ArrowRight,
  ChevronDown,
  Zap,
  TreePine,
  Droplets
} from 'lucide-react';
import { useGlobalLoader } from '@/store/useGlobalLoader';

const Home = () => {
  const navigate = useNavigate();
  const { setLoading } = useGlobalLoader();
  
  const handleNavigation = async (path: string) => {
    setLoading(true, 'Navigating to LCA Analysis...');
    setTimeout(() => {
      navigate(path);
      setLoading(false);
    }, 1500);
  };

  const stats = [
    { icon: Factory, label: "Industries Analyzed", value: "50+" },
    { icon: Recycle, label: "Circularity Improved", value: "35%" },
    { icon: Leaf, label: "CO2 Reduced", value: "2.5M kg" },
    { icon: Globe, label: "Countries", value: "12" },
  ];

  const features = [
    {
      icon: BarChart3,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze your metallurgy processes and suggest optimal circular economy strategies."
    },
    {
      icon: Recycle,
      title: "Circularity Assessment",
      description: "Comprehensive evaluation of recycling, reuse, and waste reduction opportunities in your supply chain."
    },
    {
      icon: Shield,
      title: "Environmental Impact",
      description: "Detailed carbon footprint, water usage, and energy consumption analysis with actionable insights."
    },
    {
      icon: Globe,
      title: "Sustainability Metrics",
      description: "Track progress toward sustainability goals with real-time monitoring and reporting capabilities."
    }
  ];

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-subtle-gradient">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <Badge variant="secondary" className="mb-6 text-sm font-medium">
                Smart India Hackathon 2025 • SIH25069
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                AI-Driven{' '}
                <span className="bg-eco-gradient bg-clip-text text-transparent">
                  LCA Tool
                </span>{' '}
                for Sustainable Metallurgy
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Visualize circular flows, reduce environmental impacts, and advance resource efficiency 
                with our intelligent Life Cycle Assessment platform designed for mining and metallurgy industries.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  className="btn-hero"
                  onClick={() => handleNavigation('/input')}
                >
                  Start Analysis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="btn-hero-outline"
                  onClick={scrollToAbout}
                >
                  Learn More
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-card rounded-2xl border border-border p-8 shadow-eco">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                        <stat.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-16 h-16 bg-success rounded-full flex items-center justify-center shadow-glow"
              >
                <TreePine className="h-8 w-8 text-success-foreground" />
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-eco"
              >
                <Droplets className="h-6 w-6 text-secondary-foreground" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Intelligent Sustainability Analysis
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered platform combines advanced analytics with circular economy principles 
              to provide actionable insights for sustainable metallurgy practices.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="card-eco hover:scale-105 transition-transform duration-300 h-full">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-eco-gradient rounded-xl flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Advancing Circularity in Metallurgy
              </h2>
              
              <div className="space-y-6 text-muted-foreground">
                <p className="text-lg">
                  <strong className="text-foreground">Background:</strong> As industries increasingly 
                  emphasize sustainability, Life Cycle Assessment (LCA) has become crucial for measuring 
                  environmental impacts and advancing circular economy principles in metals like aluminum and copper.
                </p>
                
                <p className="text-lg">
                  <strong className="text-foreground">Problem:</strong> Traditional LCA tools are complex, 
                  time-consuming, and often lack the intelligence needed for automated data estimation and 
                  circular economy optimization in metallurgy and mining sectors.
                </p>
                
                <p className="text-lg">
                  <strong className="text-foreground">Solution:</strong> Our AI-powered platform provides 
                  an intuitive interface where users can input process data, leverage AI for missing information, 
                  and receive comprehensive visualizations with actionable recommendations for improving circularity.
                </p>
              </div>
              
              <div className="mt-8">
                <Button 
                  size="lg"
                  onClick={() => handleNavigation('/input')}
                  className="btn-hero"
                >
                  Try the Platform
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
                <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Hackathon Details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">Project ID:</span>
                    <Badge variant="secondary">SIH25069</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">Organization:</span>
                    <span className="text-muted-foreground">Ministry of Mines</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">Theme:</span>
                    <span className="text-muted-foreground">Metallurgy</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">Focus:</span>
                    <span className="text-muted-foreground">Circular Economy</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your Sustainability Impact?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the future of sustainable metallurgy with our AI-powered LCA platform. 
              Start your analysis today and discover optimization opportunities.
            </p>
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => handleNavigation('/input')}
              className="font-semibold"
            >
              Begin Your LCA Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;