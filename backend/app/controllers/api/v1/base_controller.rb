module Api
  module V1
    class BaseController < ApplicationController
      rescue_from Mongoid::Errors::DocumentNotFound, with: :render_not_found
      rescue_from ActionController::ParameterMissing,  with: :render_bad_request

      private

      def render_not_found
        render json: { errors: [ "Resource not found" ] }, status: :not_found
      end

      def render_bad_request(error)
        render json: { errors: [ error.message ] }, status: :bad_request
      end
    end
  end
end
