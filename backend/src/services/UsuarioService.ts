import { Not, type DataSource, type Repository } from "typeorm";
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

    async getByEmailExcluindoId(email: string, idExcluir: string) {
        return await this.userRepo.findOneBy({
            email,
            id_user: Not(idExcluir),
        });
    }

    async getByNomeExcluindoId(nome: string, idExcluir: string) {
        return await this.userRepo.findOneBy({
            nome,
            id_user: Not(idExcluir),
        });
    }

    private sanitizeNome(nome: string) {
        return nome.trim();
    }

    private sanitizeEmail(email: string) {
        return email.trim().toLowerCase();
    }

    async createUsuario(userData: CreateUsuarioDTO) {
        const nomeSanitizado = this.sanitizeNome(userData.nome);
        const emailSanitizado = this.sanitizeEmail(userData.email);

        const usuarioMesmoEmail = await this.getByEmail(emailSanitizado);
        if (usuarioMesmoEmail) {
            throw new AppError("Email ja cadastrado!", 409);
        }

        const usuarioMesmoNome = await this.getByNome(nomeSanitizado);
        if (usuarioMesmoNome) {
            throw new AppError("Nome de usuario ja cadastrado!", 409);
        }

        const senha_hash = await hash(userData.password, 10);

        const novoUsuario = this.userRepo.create({
            nome: nomeSanitizado,
            email: emailSanitizado,
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

        const nomeAtualizado = userUpdate.nome ? this.sanitizeNome(userUpdate.nome) : undefined;
        const emailAtualizado = userUpdate.email ? this.sanitizeEmail(userUpdate.email) : undefined;

        if (emailAtualizado) {
            const emailEmUso = await this.getByEmailExcluindoId(emailAtualizado, usuario.id_user);
            if (emailEmUso) {
                throw new AppError("Email ja cadastrado!", 409);
            }
        }

        if (nomeAtualizado) {
            const nomeEmUso = await this.getByNomeExcluindoId(nomeAtualizado, usuario.id_user);
            if (nomeEmUso) {
                throw new AppError("Nome de usuario ja cadastrado!", 409);
            }
        }

        Object.assign(usuario, {
            ...userUpdate,
            nome: nomeAtualizado ?? usuario.nome,
            email: emailAtualizado ?? usuario.email,
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