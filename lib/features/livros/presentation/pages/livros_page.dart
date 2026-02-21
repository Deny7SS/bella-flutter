import 'package:flutter/material.dart';

class LivrosPage extends StatelessWidget {
  const LivrosPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Livros')),
      body: const Center(child: Text('Livros Page')),
    );
  }
}
