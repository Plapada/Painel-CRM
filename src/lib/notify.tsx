import { toast } from "sonner"
import { CustomToast } from "@/components/ui/custom-toast"

export const notify = {
    success: (description: string, title: string = "Sucesso") => {
        toast.custom((id) => <CustomToast id={id} variant="success" description={description} title={title} />)
    },
    error: (description: string, title: string = "Erro") => {
        toast.custom((id) => <CustomToast id={id} variant="error" description={description} title={title} />)
    },
    warning: (description: string, title: string = "Atenção") => {
        toast.custom((id) => <CustomToast id={id} variant="warning" description={description} title={title} />)
    },
    info: (description: string, title: string = "Informação") => {
        toast.custom((id) => <CustomToast id={id} variant="default" description={description} title={title} />)
    }
}
