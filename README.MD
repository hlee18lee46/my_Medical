

--Please Change Node Version

nvm install 20
nvm use 20


docker rm -f $(docker ps -aq --filter "ancestor=midnightnetwork/proof-server") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "ancestor=midnightnetwork/midnight-node:0.12.0") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "ancestor=midnightntwrk/indexer-standalone") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter name=testcontainers) 2>/dev/null || true

docker ps

--remove accordingly

docker rm -f midnight 2>/dev/null || true

--check docker again

docker ps

--create cache dir

mkdir -p $HOME/.cache/midnight/zk-params

--run testnet

docker run -d \
  --name mid-proof-testnet \
  -p 6300:6300 \
  -v $HOME/.cache/midnight/zk-params:/root/.cache/midnight/zk-params \
  -e RUST_BACKTRACE=1 \
  -e RUST_LOG=info,actix_web=info \
  midnightnetwork/proof-server:4.0.0 \
  midnight-proof-server --network testnet



  --checking transaction

  curl --ca-native -X POST https://indexer.testnet.midnight.network/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query($id: String!) { transaction(id: $id) { id status blockHeight timestamp } }",
    "variables": { "id": "000000003a7e9df591f4f9546863b5df7564908f399cf87ec1debebe15c2ea38962c3213" }
  }'




  go to 

  cd dapp
  npm run dev