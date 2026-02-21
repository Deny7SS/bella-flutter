import 'package:flutter/material.dart';

class JogosPage extends StatelessWidget {
  const JogosPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Jogos')),
      body: const Center(child: Text('Jogos Page')),
    );
  }
}
