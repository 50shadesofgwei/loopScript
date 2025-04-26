# loopScript

Simple trading interface for contango loop perps positions

## Installation

Clone the repository:

```bash
git clone https://github.com/50shadesofgwei/loopScript.git
cd loopScript
```

## Dependencies

```bash
npm install
```

## env Vars

Fill out .env with the variables laid out in the `example.env` file.
You will need:
- Ox API key
- An Executor Wallet + priv key
- An Arbitrum RPC

## To Run the Script

Use command:
```bash
ts-node --esm runScript.ts
```