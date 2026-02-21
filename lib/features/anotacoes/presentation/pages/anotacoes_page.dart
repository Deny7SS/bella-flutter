import 'package:flutter/material.dart';

class AnotacoesPage extends StatelessWidget {
  const AnotacoesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Anotações')),
      body: const Center(child: Text('Anotações Page')),
    );
  }
}
