import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ChainId } from "@thirdweb-dev/sdk";
import Phaser from "phaser";

export default class EndingScene extends Phaser.Scene {
  score = 0;
  recordSeconds = 0;
  username = "";
  nftTitle: Phaser.GameObjects.Text | undefined;

  constructor() {
    super({ key: "ending" });
  }

  init(data: any) {
    this.score = data.score;
    this.recordSeconds = data.recordTime / 1000;
  }

  preload() {
    this.load.html("mintform", "assets/form.html");
  }

  create() {
    this.add.image(400, 300, "pic");

    this.nftTitle = this.add.text(10, 10, "Submit your nickname to mint", {
      color: "white",
      fontFamily: "Arial",
      fontSize: "32px ",
    });

    var element = this.add.dom(400, 300).createFromCache("mintform");

    element.setPerspective(800);

    element.addListener("click");

    element.on("click", (event: any) => {
      if (event.target.name === "submitButton") {
        //  Turn off the click events
        element.removeListener("click");

        var inputUsername: any = element.getChildByName("username");

        //  Have they entered anything?
        if (inputUsername.value !== "") {
          //  Populate the text with whatever they typed in as the username!
          if (this.nftTitle) {
            this.nftTitle.setText(
              "Congrats " +
                inputUsername.value +
                " for scoring " +
                this.score +
                " in " +
                this.recordSeconds +
                " seconds. "
            );

            this.username = inputUsername.value;
            this.mintWithSignature();
          }
        } else {
          //  Flash the prompt
          alert("Write your nickname");
        }
      }
    });
  }

  // This function calls a Next JS API route that mints an NFT with signature-based minting.
  // We send in the address of the current user, and the text they entered as part of the request.
  mintWithSignature = async () => {
    if (!window.ethereum) return;

    // Connect with Metamask and switch to Mumbai
    const MetaMask = (await import("@thirdweb-dev/wallets")).MetaMask;
    const wallet = new MetaMask({ appName: "Phaser-Platformer" });
    const { address, chainId } = await wallet.connect(ChainId.Mumbai);
    const signer = await wallet.getSigner(chainId);

    // Fetch the NFT collection from thirdweb via it's contract address.
    const sdk = ThirdwebSDK.fromSigner(signer);
    const nftCollection = await sdk.getContract(
      process.env.NEXT_PUBLIC_NFT_COLLECTION_ADDRESS || "", // Replace this with your NFT Collection contract address
      "nft-collection"
    );

    try {
      if (!this.nftTitle?.text) {
        alert("Please enter a name.");
        return;
      }

      // Make a request to /api/server
      const signedPayloadReq = await fetch(`/api/server`, {
        method: "POST",
        body: JSON.stringify({
          playerAddress: address, // Address of the current user
          username: this.username,
          recordSeconds: this.recordSeconds,
        }),
      });

      // Grab the JSON from the response
      const json = await signedPayloadReq.json();

      if (!signedPayloadReq.ok) {
        alert(json.error);
      }

      // If the request succeeded, we'll get the signed payload from the response.
      // The API should come back with a JSON object containing a field called signedPayload.
      // This line of code will parse the response and store it in a variable called signedPayload.
      const signedPayload = json.signedPayload;

      // Now we can call signature.mint and pass in the signed payload that we received from the server.
      // This means we provided a signature for the user to mint an NFT with.
      const nft = await nftCollection?.signature.mint(signedPayload);

      alert("Minted succesfully!");

      return nft;
    } catch (e) {
      console.error("An error occurred trying to mint the NFT:", e);
    }
  };
}
