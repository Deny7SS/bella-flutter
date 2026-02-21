import 'package:flutter/material.dart';

class AudiobooksPage extends StatelessWidget {
  const AudiobooksPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Audiobooks')),
      body: const Center(child: Text('Audiobooks Page')),
    );
  }
}
