"use client";

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { useFormStore } from '@/hooks/useFormStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import Swal from 'sweetalert2';

const Login = () => {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { setUser: setFormUser } = useFormStore();
    const { setUser: setAuthUser } = useAuthStore();

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await loginAction(formData);
            
            if (result.success && result.user) {
                // Guardar usuario en ambos stores
                setFormUser({
                    ...result.user,
                    isAuthenticated: true,
                });
                
                // Guardar en el store de autenticación con rol
                setAuthUser(result.user);
                
                await Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "Sesión iniciada correctamente!",
                    showConfirmButton: false,
                    timer: 1500
                });
                
                // Redirigir según el rol
                if (result.user.rol === 'admin') {
                    router.push("/admin");
                } else {
                    router.push("/agendar");
                }
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: result.error || "Correo o contraseña incorrectos",
                });
            }
        });
    };

    return (
         <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <img
                    alt="Amaris Logo"
                    src="/images/amarisLogo.png"
                    className="mx-auto h-40 w-auto"
                />
                <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-[#52a2b2]">
                    Inicia sesión con tu cuenta
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className=" block text-sm/6 font-medium text-gray-900">
                            Email
                        </label>
                        <div className="mt-2 border rounded-md shadow-sm">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                disabled={isPending}
                                maxLength={255}
                                placeholder="tu@email.com"
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                                Contraseña
                            </label>
                        </div>
                        <div className="mt-2 border rounded-md shadow-sm">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                disabled={isPending}
                                minLength={6}
                                maxLength={100}
                                placeholder="••••••••"
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex w-full justify-center rounded-md bg-[#52a2b2] px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm/6 text-gray-500">
                    No tienes una cuenta?{' '}
                    <a href="/register" className="font-semibold text-[#a6d230] hover:text-indigo-500">
                        Regístrate en AMARIS
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;