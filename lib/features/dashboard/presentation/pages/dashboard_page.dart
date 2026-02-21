import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:bella_app/core/styles/app_colors.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bella App'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => context.go('/perfil'),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.2,
          children: [
            _buildFeatureCard(
              context,
              'Resumos',
              Icons.article,
              Colors.blue,
              '/resumos',
            ),
            _buildFeatureCard(
              context,
              'Quiz',
              Icons.quiz,
              Colors.green,
              '/quiz',
            ),
            _buildFeatureCard(
              context,
              'Cronograma',
              Icons.calendar_today,
              Colors.orange,
              '/cronograma',
            ),
            _buildFeatureCard(
              context,
              'Anotações',
              Icons.note,
              Colors.purple,
              '/anotacoes',
            ),
            _buildFeatureCard(
              context,
              'Progresso',
              Icons.trending_up,
              Colors.teal,
              '/progresso',
            ),
            _buildFeatureCard(
              context,
              'Desafios',
              Icons.emoji_events,
              Colors.amber,
              '/desafios',
            ),
            _buildFeatureCard(
              context,
              'Mix',
              Icons.music_note,
              Colors.pink,
              '/mix',
            ),
            _buildFeatureCard(
              context,
              'Jogos',
              Icons.videogame_asset,
              Colors.red,
              '/jogos',
            ),
            _buildFeatureCard(
              context,
              'Audiobooks',
              Icons.headphones,
              Colors.indigo,
              '/audiobooks',
            ),
            _buildFeatureCard(
              context,
              'Livros',
              Icons.book,
              Colors.brown,
              '/livros',
            ),
            _buildFeatureCard(
              context,
              'Notícias',
              Icons.newspaper,
              Colors.cyan,
              '/noticias',
            ),
            _buildFeatureCard(
              context,
              'Clima',
              Icons.wb_sunny,
              Colors.deepOrange,
              '/clima',
            ),
            _buildFeatureCard(
              context,
              'Wikipedia',
              Icons.public,
              Colors.lightBlue,
              '/wikipedia',
            ),
            _buildFeatureCard(
              context,
              'Belinha',
              Icons.smart_toy,
              Colors.lightGreen,
              '/belinha',
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Início',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.explore),
            label: 'Descobrir',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    String route,
  ) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () => context.go(route),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}