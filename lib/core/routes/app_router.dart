import 'package:go_router/go_router.dart';
import 'package:bella_app/features/auth/presentation/pages/login_page.dart';
import 'package:bella_app/features/auth/presentation/pages/register_page.dart';
import 'package:bella_app/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:bella_app/features/resumos/presentation/pages/resumos_page.dart';
import 'package:bella_app/features/resumos/presentation/pages/resumo_detalhe_page.dart';
import 'package:bella_app/features/quiz/presentation/pages/quiz_page.dart';
import 'package:bella_app/features/cronograma/presentation/pages/cronograma_page.dart';
import 'package:bella_app/features/anotacoes/presentation/pages/anotacoes_page.dart';
import 'package:bella_app/features/admin/presentation/pages/admin_page.dart';
import 'package:bella_app/features/progresso/presentation/pages/progresso_page.dart';
import 'package:bella_app/features/desafios/presentation/pages/desafios_page.dart';
import 'package:bella_app/features/mix/presentation/pages/mix_page.dart';
import 'package:bella_app/features/perfil/presentation/pages/perfil_page.dart';
import 'package:bella_app/features/belinha/presentation/pages/belinha_page.dart';
import 'package:bella_app/features/jogos/presentation/pages/jogos_page.dart';
import 'package:bella_app/features/audiobooks/presentation/pages/audiobooks_page.dart';
import 'package:bella_app/features/livros/presentation/pages/livros_page.dart';
import 'package:bella_app/features/noticias/presentation/pages/noticias_page.dart';
import 'package:bella_app/features/clima/presentation/pages/clima_page.dart';
import 'package:bella_app/features/wikipedia/presentation/pages/wikipedia_page.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/resumos',
        builder: (context, state) => const ResumosPage(),
      ),
      GoRoute(
        path: '/resumos/:id',
        builder: (context, state) => ResumoDetalhePage(
          resumoId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/quiz',
        builder: (context, state) => const QuizPage(),
      ),
      GoRoute(
        path: '/cronograma',
        builder: (context, state) => const CronogramaPage(),
      ),
      GoRoute(
        path: '/anotacoes',
        builder: (context, state) => const AnotacoesPage(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminPage(),
      ),
      GoRoute(
        path: '/progresso',
        builder: (context, state) => const ProgressoPage(),
      ),
      GoRoute(
        path: '/desafios',
        builder: (context, state) => const DesafiosPage(),
      ),
      GoRoute(
        path: '/mix',
        builder: (context, state) => const MixPage(),
      ),
      GoRoute(
        path: '/perfil',
        builder: (context, state) => const PerfilPage(),
      ),
      GoRoute(
        path: '/belinha',
        builder: (context, state) => const BelinhaPage(),
      ),
      GoRoute(
        path: '/jogos',
        builder: (context, state) => const JogosPage(),
      ),
      GoRoute(
        path: '/audiobooks',
        builder: (context, state) => const AudiobooksPage(),
      ),
      GoRoute(
        path: '/livros',
        builder: (context, state) => const LivrosPage(),
      ),
      GoRoute(
        path: '/noticias',
        builder: (context, state) => const NoticiasPage(),
      ),
      GoRoute(
        path: '/clima',
        builder: (context, state) => const ClimaPage(),
      ),
      GoRoute(
        path: '/wikipedia',
        builder: (context, state) => const WikipediaPage(),
      ),
    ],
    initialLocation: '/login',
    debugLogDiagnostics: true,
  );
}