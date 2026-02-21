import 'package:flutter/material.dart';

class WikipediaPage extends StatelessWidget {
  const WikipediaPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wikipedia')),
      body: const Center(child: Text('Wikipedia Page')),
    );
  }
}
