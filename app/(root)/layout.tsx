import Header from "@/components/Header";
import AlertNotifier from "@/components/AlertNotifier";


const Layout=({children}:{children : React.ReactNode})  =>{
    return(
        <main className="min-h-screen text-gray-400">
            <Header/>
            <AlertNotifier/>
        <div className="container py-10">
            {children}
        </div>
        </main>
    )
}
export default Layout
