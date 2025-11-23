import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Lock, User } from 'lucide-react';
import { authAPI } from '../services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.login(formData.username, formData.password);
      // Başarılı giriş sonrası yönlendirme
      navigate('/');
    } catch (err) {
      console.error('Giriş hatası:', err);
      setError(err.response?.data?.error || 'Giriş başarısız. Kullanıcı adı veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <Briefcase className="h-10 w-10 text-blue-600" />
            <h1 className="ml-3 text-3xl font-bold text-gray-900">Karanix</h1>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Giriş Yap</CardTitle>
            <CardDescription className="text-center">
              Operasyon paneline erişmek için bilgilerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="admin" 
                    className="pl-10"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••" 
                    className="pl-10"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t pt-6 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              <p className="font-semibold mb-1">Demo Giriş Bilgileri:</p>
              <p>Yönetici: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span></p>
              <p>Rehber: <span className="font-mono">guide1</span> / <span className="font-mono">guide123</span></p>
                <p>Sürücü: <span className="font-mono">driver1</span> / <span className="font-mono">driver123</span></p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
