# AI-Driven Moroccan WhatsApp Delivery Assistant

## Architecture Overview

This project consists of:
1. **Node.js + Fastify Backend:** Handles API endpoints, Webhooks from Meta, and business logic.
2. **PostgreSQL + Prisma:** Secure database schema containing user data, shipments, and billing transactions.
3. **Redis + BullMQ:** Queue-based worker pattern for asynchronous background logic:
   - Extracting and parsing audio notes for transcription without blocking the main event loops.
   - Batching rules calculation (holding solo packages in an isolated queue pending a matching route group).
4. **OpenRouter AI Gateway:** All processing of Natural Language logic strictly hits OpenRouter endpoints using their explicit Free Models Router `free-models-router`.
5. **Local Audio Pipeline:** Uses `fluent-ffmpeg` to transform raw WhatsApp media to `.wav` internally to be piped into a local `faster-whisper` script wrapper (or python process) to guarantee zero paid AI endpoints for audio processing.

## Hard Constraints
- No paid limits/calls inside OpenRouter.
- Moroccan Darija explicitly handled via local model processing.

## Setup Requirements

- Node.js >= 18
- Redis Server
- PostgreSQL Server 

## Configuration

Duplicate `.env.example` -> `.env` and fill the variables.
