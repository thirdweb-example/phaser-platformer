import {
  ThirdwebNftMedia,
  useAddress,
  useContract,
  useNFTs,
} from "@thirdweb-dev/react";
import type { NextPage } from "next";
import { Game as GameType } from "phaser";
import { useEffect, useState } from "react";
import styles from "./styles/Home.module.css";

const Home: NextPage = () => {
  const [game, setGame] = useState<GameType>();

  useEffect(() => {
    // import dynamically phaser sdk
    async function initPhaser() {
      const Phaser = await import("phaser");

      // import dynamically game scenes
      const { default: PlatformerScene } = await import(
        "../components/PlatformerScene"
      );
      const { default: EndingScene } = await import(
        "../components/EndingScene"
      );

      // run only once
      if (game) {
        return;
      }

      // create new phaser game
      const phaserGame = new Phaser.Game({
        type: Phaser.AUTO,
        parent: "app",
        width: 800,
        height: 600,
        physics: {
          default: "arcade",
          arcade: {
            gravity: { y: 200 },
          },
        },
        dom: {
          createContainer: true,
        },
        scene: [PlatformerScene, EndingScene],
      });

      setGame(phaserGame);
    }
    initPhaser();
  }, []);

  const address = useAddress();

  // Fetch the NFT collection from thirdweb via it's contract address.
  const { contract: nftCollection } = useContract(
    // Replace this with your NFT Collection contract address
    process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS,
    "nft-collection"
  );

  const { data: nfts, isLoading: loadingNfts } = useNFTs(nftCollection);

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Phaser Platformer</h1>
      <p className={styles.explain}>
        Signature-based minting with{" "}
        <b>
          <a
            href="https://thirdweb.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.purple}
          >
            thirdweb
          </a>
        </b>{" "}
        + Phaser Game to play and mint NFT.
      </p>

      <div id="app" key="app">
        {/* the game will be rendered here */}
      </div>

      <p>NB: Players can mint only 1 NFT per address</p>

      <hr className={styles.divider} />

      <div className={styles.collectionContainer}>
        <h2 className={styles.ourCollection}>Scoreboard</h2>

        {loadingNfts ? (
          <p>Loading...</p>
        ) : (
          <div className={styles.nftGrid}>
            {nfts?.map((nft) => (
              <div className={styles.nftItem} key={nft.metadata.id.toString()}>
                <div>
                  <ThirdwebNftMedia
                    metadata={nft.metadata}
                    style={{
                      height: 90,
                      borderRadius: 16,
                    }}
                  />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p>
                    <b>@{nft.metadata.name}</b>
                  </p>
                  <p>{nft.metadata.description}</p>
                </div>

                <div style={{ textAlign: "center" }}>
                  <p>Player address</p>
                  <p>
                    <b>
                      {nft.owner
                        .slice(0, 6)
                        .concat("...")
                        .concat(nft.owner.slice(-4))}
                    </b>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
