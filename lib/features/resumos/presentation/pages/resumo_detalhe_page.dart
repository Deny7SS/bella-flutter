import 'package:flutter/material.dart';

class ResumoDetalhePage extends StatelessWidget {
  final String resumoId;

  const ResumoDetalhePage({super.key, required this.resumoId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalhe do Resumo')),
      body: Center(child: Text('Resumo ID: $resumoId')),
    );
  }
}
