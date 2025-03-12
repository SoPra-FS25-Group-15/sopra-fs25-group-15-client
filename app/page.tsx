"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import styles from "@/styles/page.module.css";

export default function Home() {
  const router = useRouter();
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div>
          <h1 className={styles.title}>Group 15</h1>
          <h3 className={styles.subtitle}>sopra-fs25-group-15-client</h3>
        </div>
        <div className={styles.ctas}>
          <Button
            type="primary"
            variant="solid"
            onClick={() => router.push("/login")}
          >
            Go to login
          </Button>
        </div>
      </main>
    </div>
  );
}
