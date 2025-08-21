import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Leaf, 
  Shield, 
  TrendingUp, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Play,
  Star
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6E2CC] via-[#FCFEFF] to-[#D6E2CC]">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/GreenerTech-Logo.jpg"
                alt="Greener Tech Logo"
                className="h-12 w-auto"
              />
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">Fonctionnalités</a>
              <a href="#about" className="text-gray-700 hover:text-green-600 transition-colors">À propos</a>
              <a href="#contact" className="text-gray-700 hover:text-green-600 transition-colors">Contact</a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                  Se connecter
                </Button>
              </Link>
              <Link to="/role-selection">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Commencer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  L'avenir de l'
                  <span className="text-green-600">agriculture</span>
                  <br />
                  est intelligent
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Greener Tech révolutionne la gestion agricole avec des solutions IoT avancées, 
                  de l'intelligence artificielle et une surveillance en temps réel pour optimiser 
                  vos cultures et maximiser vos rendements.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/role-selection">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 text-lg">
                  <Play className="mr-2 h-5 w-5" />
                  Voir la démo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">4.9/5</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">1000+</span> agriculteurs satisfaits
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1574943320219-553eb213f72f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                  alt="Smart Agriculture Technology"
                  className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
                />
              </div>
              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-6 border border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">+45%</div>
                    <div className="text-sm text-gray-600">Rendement moyen</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités principales
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez comment Greener Tech transforme votre approche de l'agriculture 
              avec des outils intelligents et des insights en temps réel.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Leaf className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Surveillance intelligente
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Surveillez vos cultures en temps réel avec des capteurs IoT avancés 
                et des analyses prédictives pour optimiser la croissance.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Gestion des alertes
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Recevez des notifications instantanées sur les conditions critiques 
                et gérez les interventions avec notre système d'alerte intelligent.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Rapports détaillés
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Analysez les performances de vos cultures avec des rapports 
                détaillés et des graphiques interactifs pour prendre des décisions éclairées.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200">
              <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Gestion d'équipe
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Coordonnez votre équipe technique avec des outils de gestion 
                avancés et un système de suivi des interventions en temps réel.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 border border-indigo-200">
              <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Cartographie avancée
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Visualisez vos domaines agricoles avec des cartes interactives 
                et gérez vos serres avec précision géographique.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 border border-red-200">
              <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Surveillance 24/7
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Bénéficiez d'une surveillance continue de vos cultures avec 
                des alertes automatiques et une intervention rapide en cas de besoin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">1000+</div>
              <div className="text-green-100">Agriculteurs actifs</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">50,000+</div>
              <div className="text-green-100">Serres surveillées</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">99.9%</div>
              <div className="text-green-100">Temps de disponibilité</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">+45%</div>
              <div className="text-green-100">Rendement moyen</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              En seulement 3 étapes simples, transformez votre exploitation agricole 
              avec la technologie intelligente de Greener Tech.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Créez votre compte
              </h3>
              <p className="text-gray-600">
                Inscrivez-vous en tant que directeur d'entreprise et configurez 
                votre profil en quelques minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Configurez votre entreprise
              </h3>
              <p className="text-gray-600">
                Ajoutez vos domaines agricoles, serres et équipe technique 
                pour commencer la surveillance.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Commencez à surveiller
              </h3>
              <p className="text-gray-600">
                Accédez à vos tableaux de bord en temps réel et recevez 
                des alertes intelligentes pour optimiser vos cultures.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/role-selection">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
                Commencer maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à révolutionner votre agriculture ?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Rejoignez des milliers d'agriculteurs qui ont déjà transformé 
            leurs exploitations avec Greener Tech.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/role-selection">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center">
                <img
                  src="/GreenerTech-Logo.jpg"
                  alt="Greener Tech Logo"
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-gray-400">
                L'avenir de l'agriculture est intelligent. 
                Rejoignez la révolution technologique agricole.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">À propos</a></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Connexion</Link></li>
                <li><Link to="/role-selection" className="text-gray-400 hover:text-white transition-colors">Inscription</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Assistance</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>contact@greenertech.com</li>
                <li>+212 5 22 123 456</li>
                <li>Maroc</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Greener Tech. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
