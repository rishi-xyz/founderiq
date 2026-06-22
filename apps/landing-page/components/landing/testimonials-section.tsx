"use client";

import { useEffect, useState } from "react";

const testimonials = [
  {
    quote: "FounderIQ reduced our startup review cycle from weeks to days. Our team now evaluates 10x more opportunities without expanding headcount.",
    author: "Michael Thompson",
    role: "Venture Partner",
    company: "Horizon Ventures",
    metric: "10x more startups evaluated",
  },
  {
    quote: "The AI founder interviews give us insights that manual meetings never would. We're making better investment decisions faster.",
    author: "Jennifer Lee",
    role: "Partner",
    company: "Angel Capital Network",
    metric: "80% faster due diligence",
  },
  {
    quote: "Investment memos that used to take our analysts two days now generate in minutes. The quality is institutional-grade.",
    author: "David Chen",
    role: "Managing Director",
    company: "TechFund Capital",
    metric: "15 hours saved per deal",
  },
  {
    quote: "As an accelerator director, screening hundreds of applications was impossible. FounderIQ makes it manageable and intelligent.",
    author: "Rachel Martinez",
    role: "Executive Director",
    company: "StartupAccel",
    metric: "500+ apps processed",
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section className="relative py-20 lg:py-28 border-t border-foreground/10">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-4">
            What investors say
          </span>
          <h2 className="text-3xl lg:text-4xl font-display tracking-tight text-foreground">
            Trusted by top investment firms.
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="p-6 lg:p-8 border border-foreground/10 rounded-lg hover:border-foreground/20 transition-all duration-300"
            >
              <p className="text-sm lg:text-base text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg text-foreground">{testimonial.metric.split(" ").slice(0, 2).join(" ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.metric.split(" ").slice(2).join(" ")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
