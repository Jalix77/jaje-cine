/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import AuthGuard from '../components/feature/AuthGuard';
import AdminGuard from '../components/AdminGuard';

// Lazy load components
const HomePage = lazy(() => import('../pages/home/page'));
const FilmsPage = lazy(() => import('../pages/films/page'));
const FilmDetailPage = lazy(() => import('../pages/films/detail/page'));
const SeancesPage = lazy(() => import('../pages/seances/page'));
const ReservationPage = lazy(() => import('../pages/reservation/page'));

const SeatSelectionPage = lazy(() => import('../pages/reservation/seat-selection/page'));
const PaymentPage = lazy(() => import('../pages/reservation/payment/page'));
const TicketPage = lazy(() => import('../pages/ticket/page'));
const CheckoutPage = lazy(() => import('../pages/reservation/checkout/page'));
const ConfirmationPage = lazy(() => import('../pages/reservation/confirmation/page'));

const LoginPage = lazy(() => import('../pages/auth/login/page'));
const RegisterPage = lazy(() => import('../pages/auth/register/page'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/forgot-password/page'));
const ResetPasswordPage = lazy(() => import('../pages/auth/reset-password/page'));
const AuthCallbackPage = lazy(() => import('../pages/auth/callback/page'));
const SetPasswordPage = lazy(() => import('../pages/auth/set-password/page'));

const ComptePage = lazy(() => import('../pages/compte/page'));
const TicketsPage = lazy(() => import('../pages/compte/tickets/page'));

const ContactPage = lazy(() => import('../pages/contact/page'));
const ConditionsPage = lazy(() => import('../pages/conditions/page'));
const ConfidentialitePage = lazy(() => import('../pages/confidentialite/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Admin pages
const AdminDashboardPage = lazy(() => import('../pages/admin/dashboard/page'));
const AdminLoginPage = lazy(() => import('../pages/admin/login/page'));
const AdminFilmsPage = lazy(() => import('../pages/admin/films/page'));
const AdminSeancesPage = lazy(() => import('../pages/admin/seances/page'));
const AdminSallesPage = lazy(() => import('../pages/admin/salles/page'));
const AdminReservationsPage = lazy(() => import('../pages/admin/reservations/page'));
const AdminContentPage = lazy(() => import('../pages/admin/content/page'));
const AdminSupportPage = lazy(() => import('../pages/admin/support/page'));
const AdminAuditPage = lazy(() => import('../pages/admin/audit/page'));
const AdminScanPage = lazy(() => import('../pages/admin/scan/page'));
// Wrapper pour les composants lazy avec Suspense
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Chargement...
      </div>
    }
  >
    {children}
  </Suspense>
);

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <LazyWrapper>
        <HomePage />
      </LazyWrapper>
    ),
  },
  {
    path: '/films',
    element: (
      <LazyWrapper>
        <FilmsPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/films/:id',
    element: (
      <LazyWrapper>
        <FilmDetailPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/seances',
    element: (
      <LazyWrapper>
        <SeancesPage />
      </LazyWrapper>
    ),
  },

  // Reservation landing page
  {
    path: '/reservation',
    element: (
      <LazyWrapper>
        <ReservationPage />
      </LazyWrapper>
    ),
  },

  // (Optionnel mais utile) si quelqu’un tape /reservation/seat-selection sans id
  {
    path: '/reservation/seat-selection',
    element: <Navigate to="/reservation" replace />,
  },

  {
    path: '/reservation/seat-selection/:showtimeId',
    element: (
      <LazyWrapper>
        <SeatSelectionPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/reservation/payment',
    element: (
      <LazyWrapper>
        <PaymentPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/reservation/checkout',
    element: (
      <LazyWrapper>
        <CheckoutPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/reservation/payment/:reservationId',
    element: (
      <LazyWrapper>
        <PaymentPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/reservation/confirmation',
    element: (
      <LazyWrapper>
        <ConfirmationPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/reservation/confirmation/:reservationId',
    element: (
      <LazyWrapper>
        <ConfirmationPage />
      </LazyWrapper>
    ),
  },

  {
    path: '/auth/login',
    element: (
      <LazyWrapper>
        <LoginPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/auth/register',
    element: (
      <LazyWrapper>
        <RegisterPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/auth/forgot-password',
    element: (
      <LazyWrapper>
        <ForgotPasswordPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/auth/reset-password',
    element: (
      <LazyWrapper>
        <ResetPasswordPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <LazyWrapper>
        <AuthCallbackPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/auth/set-password',
    element: (
      <LazyWrapper>
        <SetPasswordPage />
      </LazyWrapper>
    ),
  },

  {
    path: '/compte',
    element: (
      <LazyWrapper>
        <AuthGuard>
          <ComptePage />
        </AuthGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/compte/tickets',
    element: (
      <LazyWrapper>
        <AuthGuard>
          <TicketsPage />
        </AuthGuard>
      </LazyWrapper>
    ),
  },

  {
    path: '/ticket/:id',
    element: (
      <LazyWrapper>
        <TicketPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/contact',
    element: (
      <LazyWrapper>
        <ContactPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/conditions',
    element: (
      <LazyWrapper>
        <ConditionsPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/confidentialite',
    element: (
      <LazyWrapper>
        <ConfidentialitePage />
      </LazyWrapper>
    ),
  },

  // Admin routes
  {
    path: '/admin/login',
    element: (
      <LazyWrapper>
        <AdminLoginPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/admin',
    element: (
      <LazyWrapper>
        <Navigate to="/admin/dashboard" replace />
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <LazyWrapper>
        <AdminGuard requiredRole="ADMIN">
          <AdminDashboardPage />
        </AdminGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/films',
    element: (
      <LazyWrapper>
        <AdminGuard requiredRole="ADMIN">
          <AdminFilmsPage />
        </AdminGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/seances',
    element: (
      <LazyWrapper>
        <AdminGuard requiredRole="ADMIN">
          <AdminSeancesPage />
        </AdminGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/salles',
    element: (
      <LazyWrapper>
        <AdminGuard requiredRole="ADMIN">
          <AdminSallesPage />
        </AdminGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/reservations',
    element: (
      <LazyWrapper>
        <AdminGuard requiredRole="ADMIN">
          <AdminReservationsPage />
        </AdminGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/content',
    element: (
      <LazyWrapper>
        <AdminGuard requiredRole="ADMIN">
          <AdminContentPage />
        </AdminGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/support',
    element: (
      <LazyWrapper>
        <AdminGuard requiredRole="ADMIN">
          <AdminSupportPage />
        </AdminGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/audit',
    element: (
      <LazyWrapper>
        <AdminGuard requiredRole="ADMIN">
          <AdminAuditPage />
        </AdminGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/scan',
    element: (
      <LazyWrapper>
        <AdminGuard requiredRole="ADMIN">
          <AdminScanPage />
        </AdminGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '*',
    element: (
      <LazyWrapper>
        <NotFound />
      </LazyWrapper>
    ),
  },
];

export default routes;