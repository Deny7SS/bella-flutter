import 'package:flutter/material.dart';

class ClimaPage extends StatelessWidget {
  const ClimaPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clima')),
      body: const Center(child: Text('Clima Page')),
    );
  }
}
