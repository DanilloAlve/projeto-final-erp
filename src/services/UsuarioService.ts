import type { DataSource, Repository } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import { hash } from "bcryptjs";
import type { CreateUsuarioDTO, UpdateUsuarioDTO } from "../dtos/UsuarioDTO.js";
import { AppError } from "../errors/AppErrors.js";

export class UsuarioService {
    // Implementação dos métodos de serviço para o usuário
    private userRepo: Repository<Usuario>;
    
    constructor(DataSource: DataSource) {
        this.userRepo = DataSource.getRepository(Usuario);
    }

    async getById(id: string){
        return await this.userRepo.findOneBy({id_user: id});           
    }

    async findAll() {
        return await this.userRepo.find();
    }    

    async getByEmail(email: string){
        return await this.userRepo.findOne({
            where: { email },
            select: ["id_user", "nome", "email", "senha", "perfil"]
        });
    }
    
    async getByNome(nome: string){
        return await this.userRepo.findOneBy({nome: nome});        
    }

    async createUsuario(userData: CreateUsuarioDTO) {
        const usuario = await this.getByEmail(userData.email);

    if (usuario) {
        throw new AppError("Usuario ja cadastrado!", 409);
    }

    const senha_hash = await hash(userData.password, 10);

    const novoUsuario = this.userRepo.create({
        nome: userData.nome,
        email: userData.email,
        senha: senha_hash,
        perfil: userData.perfil,
    });

    return await this.userRepo.save(novoUsuario);
}
    async updateUsuario(id: string, userUpdate: UpdateUsuarioDTO) {
        const usuario = await this.getById(id);

        if (!usuario) {
            throw new AppError("Usuario nao encontrado!", 404);
        }

        if (userUpdate.email && userUpdate.email !== usuario.email) {
            const emailEmUso = await this.getByEmail(userUpdate.email);
            if (emailEmUso) {
                throw new AppError("Email ja cadastrado!", 409);
            }
        }

        Object.assign(usuario, {
            ...userUpdate,            
        });

        return await this.userRepo.save(usuario);
    }

    async deleteUsuario(id: string) {
        const result = await this.userRepo.delete(id);

        if (result.affected === 0) {
            throw new AppError("Usuario nao encontrado!", 404);
        }
    }      

    
}