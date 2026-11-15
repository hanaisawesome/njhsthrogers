import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkH5zYy_0C-n2M5cQoljuMYnUz_srVxH8",
  authDomain: "njhsthrogers.firebaseapp.com",
  projectId: "njhsthrogers",
  storageBucket: "njhsthrogers.firebasestorage.app",
  messagingSenderId: "244806160496",
  appId: "1:244806160496:web:1ad4f044eff3d84162a4b5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
