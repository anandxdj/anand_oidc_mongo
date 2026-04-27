import "dotenv/config"
import app from "./src/app.js"
import connectDB from "./src/common/config/db.js"
import { initOidcKeys } from "./src/common/utils/keys.utils.js"
import { backfillDefaultProjects } from "./src/modules/project/project.service.js"

const PORT = process.env.PORT || 5000

const start = async () => {
    await connectDB()
    try {
        const mig = await backfillDefaultProjects()
        if (mig.updated > 0 || mig.created > 0) {
            console.log(
                `[migrate] Projects backfill: default projects created=${mig.created}, clients updated=${mig.updated}`,
            )
        }
    } catch (e) {
        console.error("[migrate] Project backfill failed:", e.message)
        throw e
    }
    await initOidcKeys()
    app.listen(PORT, () => {
        console.log(`Server is running at ${PORT} in ${process.env.NODE_ENV} mode`)
    })
}

start().catch((err) => {
    console.error("Failed to start server", err)
    process.exit(1)
})

