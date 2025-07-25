import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpiceCloudParticles from './SpiceCloudParticles';

interface SlideLayer {
  id: string;
  image: string;
  zIndex: number;
  scale: number;
  opacity: number;
  translateX: number;
  translateY: number;
  rotation: number;
  parallaxSpeed: number;
}

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  backgroundLayers: SlideLayer[];
  textColor: 'light' | 'dark';
  category: string;
  cta: {
    text: string;
    link: string;
  };
}

// Enhanced 3D parallax slides with multiple layers
const slidesData: SlideData[] = [
  {
    id: 1,
    title: "Aromatic Spice Clouds",
    subtitle: "Premium Organic Spices Collection", 
    description: "Experience the essence of nature with our premium organic spices. Each blend captures the authentic flavors from traditional farming methods across the globe.",
    textColor: 'light',
    category: "Essential Oils",
    cta: { text: "Explore Spices", link: "/products?category=essential-oils" },
    backgroundLayers: [
      {
        id: 'bg-mountains',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000',
        zIndex: 1,
        scale: 1.2,
        opacity: 0.8,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        parallaxSpeed: 0.1
      },
      {
        id: 'spice-cloud-1',
        image: 'https://images.unsplash.com/photo-1585297099574-9e40573b7f8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400',
        zIndex: 3,
        scale: 0.8,
        opacity: 0.7,
        translateX: -200,
        translateY: -100,
        rotation: -10,
        parallaxSpeed: 0.3
      },
      {
        id: 'spice-cloud-2',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300',
        zIndex: 4,
        scale: 0.6,
        opacity: 0.5,
        translateX: 300,
        translateY: -50,
        rotation: 15,
        parallaxSpeed: 0.5
      },
      {
        id: 'floating-spices',
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600',
        zIndex: 5,
        scale: 0.4,
        opacity: 0.9,
        translateX: 400,
        translateY: 200,
        rotation: 0,
        parallaxSpeed: 0.7
      }
    ]
  },
  {
    id: 2,
    title: "Advanced Processing Facility",
    subtitle: "State-of-the-Art Manufacturing",
    description: "Our modern facilities utilize cutting-edge technology and maintain the highest quality standards in organic ingredient processing while preserving natural properties.",
    textColor: 'light',
    category: "Manufacturing",
    cta: { text: "View Facility", link: "/about/manufacturing" },
    backgroundLayers: [
      {
        id: 'factory-bg',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000',
        zIndex: 1,
        scale: 1.1,
        opacity: 0.9,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        parallaxSpeed: 0.1
      },
      {
        id: 'machinery-1',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
        zIndex: 3,
        scale: 0.7,
        opacity: 0.8,
        translateX: -150,
        translateY: 100,
        rotation: -5,
        parallaxSpeed: 0.4
      },
      {
        id: 'steam-effect',
        image: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200',
        zIndex: 4,
        scale: 0.9,
        opacity: 0.3,
        translateX: 0,
        translateY: -200,
        rotation: 0,
        parallaxSpeed: 0.6
      },
      {
        id: 'quality-badge',
        image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300',
        zIndex: 5,
        scale: 0.3,
        opacity: 0.7,
        translateX: 350,
        translateY: -100,
        rotation: 10,
        parallaxSpeed: 0.8
      }
    ]
  },
  {
    id: 3,
    title: "Laboratory Excellence",
    subtitle: "Scientific Precision & Quality Control",
    description: "Our certified laboratories ensure every batch meets stringent international standards through comprehensive testing and rigorous quality assurance protocols.",
    textColor: 'light',
    category: "Quality Control",
    cta: { text: "Quality Standards", link: "/quality" },
    backgroundLayers: [
      {
        id: 'lab-bg',
        image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000',
        zIndex: 1,
        scale: 1.2,
        opacity: 0.85,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        parallaxSpeed: 0.1
      },
      {
        id: 'scientist',
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=700',
        zIndex: 3,
        scale: 0.6,
        opacity: 0.9,
        translateX: 200,
        translateY: 50,
        rotation: 0,
        parallaxSpeed: 0.3
      },
      {
        id: 'test-tubes',
        image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
        zIndex: 4,
        scale: 0.5,
        opacity: 0.8,
        translateX: -300,
        translateY: 100,
        rotation: -5,
        parallaxSpeed: 0.5
      },
      {
        id: 'molecular-structure',
        image: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400',
        zIndex: 2,
        scale: 0.4,
        opacity: 0.2,
        translateX: -100,
        translateY: -150,
        rotation: 45,
        parallaxSpeed: 0.7
      }
    ]
  },
  {
    id: 4,
    title: "Botanical Extract Gardens",
    subtitle: "Nature's Finest Concentrates",
    description: "Premium botanical extracts from carefully cultivated gardens, processed with precision to preserve bioactive compounds and deliver maximum therapeutic potential.",
    textColor: 'light',
    category: "Herbs & Botanicals",
    cta: { text: "Browse Extracts", link: "/products?category=herbs-botanicals" },
    backgroundLayers: [
      {
        id: 'garden-bg',
        image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=1000',
        zIndex: 1,
        scale: 1.1,
        opacity: 0.9,
        translateX: 0,
        translateY: 0,
        rotation: 0,
        parallaxSpeed: 0.1
      },
      {
        id: 'herb-plants',
        image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600',
        zIndex: 3,
        scale: 0.7,
        opacity: 0.8,
        translateX: -250,
        translateY: 80,
        rotation: 0,
        parallaxSpeed: 0.4
      },
      {
        id: 'floating-leaves',
        image: 'https://images.unsplash.com/photo-1574263867128-3d3b8de77ebc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
        zIndex: 4,
        scale: 0.3,
        opacity: 0.6,
        translateX: 300,
        translateY: -100,
        rotation: 20,
        parallaxSpeed: 0.6
      },
      {
        id: 'extract-drops',
        image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400',
        zIndex: 5,
        scale: 0.4,
        opacity: 0.7,
        translateX: 400,
        translateY: 150,
        rotation: -10,
        parallaxSpeed: 0.8
      }
    ]
  }
];

export default function ParallaxSlider3D() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const slideInterval = 8000; // 8 seconds per slide
  const progressInterval = 50;

  useEffect(() => {
    if (isPlaying) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }

    return () => stopAutoPlay();
  }, [isPlaying, currentSlide]);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 100;
      const y = (e.clientY / window.innerHeight - 0.5) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const startAutoPlay = () => {
    stopAutoPlay();
    setProgress(0);

    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + (100 / (slideInterval / progressInterval));
      });
    }, progressInterval);
  };

  const stopAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slidesData.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slidesData.length) % slidesData.length);
    setProgress(0);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  const currentSlideData = slidesData[currentSlide];

  return (
    <div 
      ref={sliderRef}
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ perspective: '1000px' }}
    >
      {/* 3D Parallax Layers */}
      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        {currentSlideData.backgroundLayers.map((layer, index) => (
          <div
            key={layer.id}
            className="absolute inset-0 transition-all duration-1000 ease-out"
            style={{
              zIndex: layer.zIndex,
              transform: `
                translateX(${layer.translateX + (mousePosition.x * layer.parallaxSpeed)}px)
                translateY(${layer.translateY + (mousePosition.y * layer.parallaxSpeed)}px)
                translateZ(${index * 50}px)
                rotateX(${mousePosition.y * 0.1}deg)
                rotateY(${mousePosition.x * 0.1}deg)
                rotate(${layer.rotation}deg)
                scale(${layer.scale})
              `,
              opacity: layer.opacity,
              backgroundImage: `url(${layer.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: index === 0 ? 'none' : `blur(${Math.max(0, (5 - layer.zIndex) * 0.5)}px)`,
            }}
          />
        ))}
      </div>

      {/* Advanced Particle Systems */}
      <SpiceCloudParticles 
        isActive={currentSlide === 0} 
        intensity={0.8} 
        color="spice" 
      />
      <SpiceCloudParticles 
        isActive={currentSlide === 1} 
        intensity={0.6} 
        color="steam" 
      />
      <SpiceCloudParticles 
        isActive={currentSlide === 2} 
        intensity={0.7} 
        color="molecular" 
      />
      <SpiceCloudParticles 
        isActive={currentSlide === 3} 
        intensity={0.5} 
        color="spice" 
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 z-10" />

      {/* Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div
              className="transition-all duration-1000 ease-out text-white"
              style={{
                transform: `
                  translateX(${progress * 0.3}px) 
                  translateY(${Math.sin(progress / 20) * 3}px)
                  translateZ(100px)
                `,
              }}
            >
              {/* Category Badge with 3D effect */}
              <div className="mb-6">
                <span 
                  className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-bold rounded-full backdrop-blur-sm shadow-2xl"
                  style={{
                    transform: `translateZ(50px) rotateX(${mousePosition.y * 0.05}deg)`,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(34, 197, 94, 0.3)',
                  }}
                >
                  {currentSlideData.category}
                </span>
              </div>

              {/* Subtitle */}
              <h3 
                className="text-xl sm:text-2xl font-light mb-3 opacity-90"
                style={{
                  transform: `translateZ(30px) rotateX(${mousePosition.y * 0.02}deg)`,
                  textShadow: '0 5px 15px rgba(0,0,0,0.5)',
                }}
              >
                {currentSlideData.subtitle}
              </h3>

              {/* Main Title with 3D effect */}
              <h1 
                className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
                style={{
                  transform: `translateZ(60px) rotateX(${mousePosition.y * 0.03}deg)`,
                  textShadow: '0 10px 30px rgba(0,0,0,0.7)',
                  background: 'linear-gradient(135deg, #ffffff, #e5e5e5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {currentSlideData.title}
              </h1>

              {/* Description */}
              <p 
                className="text-lg sm:text-xl mb-10 opacity-90 leading-relaxed max-w-2xl"
                style={{
                  transform: `translateZ(20px)`,
                  textShadow: '0 3px 10px rgba(0,0,0,0.5)',
                }}
              >
                {currentSlideData.description}
              </p>

              {/* CTA Button with 3D hover effect */}
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-10 py-4 text-lg font-bold transition-all duration-300 shadow-2xl"
                style={{
                  transform: `translateZ(40px) rotateX(${mousePosition.y * 0.02}deg)`,
                  boxShadow: '0 15px 35px rgba(0,0,0,0.3), 0 0 25px rgba(34, 197, 94, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `translateZ(40px) rotateX(${mousePosition.y * 0.02}deg) scale(1.05)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `translateZ(40px) rotateX(${mousePosition.y * 0.02}deg) scale(1)`;
                }}
                onClick={() => window.location.href = currentSlideData.cta.link}
              >
                {currentSlideData.cta.text}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Controls */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30">
        <div 
          className="flex items-center space-x-6 bg-black/30 backdrop-blur-xl rounded-full px-8 py-4 border border-white/20"
          style={{
            transform: `translateZ(50px)`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}
        >
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSlide}
            className="text-white hover:bg-white/20 p-3 rounded-full transition-all duration-300"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {/* Slide Indicators */}
          <div className="flex space-x-3">
            {slidesData.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white scale-125 shadow-lg' 
                    : 'bg-white/50 hover:bg-white/70 hover:scale-110'
                }`}
                style={{
                  boxShadow: index === currentSlide ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:bg-white/20 p-3 rounded-full transition-all duration-300"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="text-white hover:bg-white/20 p-3 rounded-full transition-all duration-300"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={nextSlide}
            className="text-white hover:bg-white/20 p-3 rounded-full transition-all duration-300"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Progress Bar with 3D effect */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-white/10 z-30">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100 ease-linear shadow-lg"
          style={{ 
            width: `${progress}%`,
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)',
          }}
        />
      </div>

      {/* Slide Counter */}
      <div 
        className="absolute top-8 right-8 z-30 text-white/90 text-sm font-bold bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm"
        style={{
          transform: `translateZ(30px)`,
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        }}
      >
        {String(currentSlide + 1).padStart(2, '0')} / {String(slidesData.length).padStart(2, '0')}
      </div>
    </div>
  );
}