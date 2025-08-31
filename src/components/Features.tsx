import React from 'react';
import { Zap, Database, Grid3X3, Upload } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-gray-900 p-8 rounded-xl border border-white/10 text-left">
    <div className="w-12 h-12 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const Features: React.FC = () => {
  const features = [
    {
      icon: <Zap className="w-12 h-12 text-white" />,
      title: "Edição Inteligente com IA",
      description: "Nossa IA sugere cortes, transições e até trilhas sonoras para deixar seu vídeo mais dinâmico e profissional."
    },
    {
      icon: <Database className="w-12 h-12 text-white" />,
      title: "Biblioteca de Recursos",
      description: "Acesse milhões de vídeos, imagens e músicas licenciadas para usar em seus projetos sem preocupação."
    },
    {
      icon: <Grid3X3 className="w-12 h-12 text-white" />,
      title: "Templates Prontos",
      description: "Comece rapidamente com templates profissionais para redes sociais, anúncios, vlogs e muito mais."
    },
    {
      icon: <Upload className="w-12 h-12 text-white" />,
      title: "Exportação em 4K",
      description: "Exporte seus vídeos em até 4K para garantir a melhor qualidade visual em qualquer plataforma."
    }
  ];

  return (
    <section id="features" className="py-16 lg:py-24 px-[5%] bg-black text-center">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5">
        Ferramentas poderosas, resultados profissionais.
      </h2>
      <p className="text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto mb-16 text-gray-300">
        Tudo que você precisa para criar vídeos que se destacam, com a ajuda da nossa tecnologia.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
};

export default Features;