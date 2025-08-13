'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    quote:
      "Enduro Stats completely changed how I approach my training. The training load insights helped me avoid overtraining, and I PR'd my marathon by 8 minutes!",
    name: 'Karl Tiama',
    title: 'Boston Marathon Qualifier',
    initials: 'KT',
  },
  {
    id: 2,
    quote:
      'The performance trend analysis is incredible. I can see exactly how my pace is improving over time, and the goal tracking keeps me motivated every day.',
    name: 'Sarah Chen',
    title: 'Ultra Marathon Runner',
    initials: 'SC',
  },
  {
    id: 3,
    quote:
      'Finally, a tool that makes sense of all my Strava data! The VO2 Max estimates and recovery insights have been game-changers for my training.',
    name: 'Mike Rodriguez',
    title: 'Trail Running Coach',
    initials: 'MR',
  },
];

export default function AnimatedTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % testimonials.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, [isClient]);

  const nextTestimonial = () => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      prev => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  if (!isClient) {
    return (
      <div className="max-w-4xl mx-auto text-center relative">
        <div className="flex justify-center mb-8 space-x-2">
          {testimonials.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === 0 ? 'bg-indigo-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="relative overflow-hidden min-h-[300px]">
          <div className="w-full">
            <div className="mb-8">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-6 w-6 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <blockquote className="text-2xl sm:text-3xl font-medium text-gray-900 leading-relaxed mb-8">
                &ldquo;{testimonials[0].quote}&rdquo;
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {testimonials[0].initials}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    {testimonials[0].name}
                  </p>
                  <p className="text-gray-600">{testimonials[0].title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-center relative">
      {/* Navigation Dots */}
      <div className="flex justify-center mb-8 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-indigo-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Testimonials Carousel */}
      <div className="relative overflow-hidden min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full"
          >
            <div className="mb-8">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-6 w-6 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <blockquote className="text-2xl sm:text-3xl font-medium text-gray-900 leading-relaxed mb-8">
                &ldquo;{testimonials[currentIndex].quote}&rdquo;
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {testimonials[currentIndex].initials}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    {testimonials[currentIndex].name}
                  </p>
                  <p className="text-gray-600">
                    {testimonials[currentIndex].title}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={prevTestimonial}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <button
          onClick={nextTestimonial}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
