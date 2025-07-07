

Falla
- Agregar a un estudiante --> 
   Piensa que el nombre es el nombre y tmb el apellido si solo doy el nombre (dsp no volvio a pasar)

- BuscarPorNombre --> 
   Esta la alumna llamada Lola en la lista?
   Tira que revisa y está, pero tmb q el usuario intentó agregarla de nuevo (no es así) - igualmente no la agrega, indicando qeu ya está

- BuscarPorApellido --> 
   Esta el alumno con apellido Nieto?  The response was [object Object], which means there might be results or maybe it's empty. Since the response isn't clear, I need to ask the user to provide more details. Let me check the tools again. The function returns whatever is returned by the database, so if there's no result, it's probably empty. But the user didn't specify if there's a match or not. To be safe, I should ask them to confirm if they want to search again or check another aspect. Keep it simple and clear. </think> ¿Podrías confirmar si hay un estudiante con el apellido "Nieto" o deseas buscar otro criterio?



DUDA  --> Memoria esta disponible en este modelo?
      --> Es mejor sacar toolTracker? (esta trayendo mas problemas q soluciones tal vez)

IMPLEMENTAR
- Memoria --> ContenxtChatEngine (ver segun el framework como incorporar memoria en la consulta y que la acepte)

RAG (?) --> https://docs.llamaindex.ai/en/stable/examples/chat_engine/chat_engine_context/ 






Entrar a rama del proyecto
git checkout -b <local_branch_name> origin/<remote_branch_name>